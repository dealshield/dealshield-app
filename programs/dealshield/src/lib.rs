use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod dealshield {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
        fee: u64,
        listing_id: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.listing_id = listing_id;
        escrow.amount = amount;
        escrow.fee = fee;
        escrow.state = EscrowState::Initialized;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.bump = ctx.bumps.escrow_account;

        // Transfer funds (amount + fee) from buyer to escrow vault
        let total_amount = amount.checked_add(fee).ok_or(ErrorCode::NumericalOverflow)?;
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, total_amount)?;

        Ok(())
    }

    pub fn confirm_delivery(ctx: Context<ConfirmDelivery>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        require!(escrow.state == EscrowState::Initialized, ErrorCode::InvalidState);
        require!(ctx.accounts.buyer.key() == escrow.buyer, ErrorCode::Unauthorized);

        escrow.state = EscrowState::Delivered;

        // Calculate amounts
        let amount = escrow.amount;
        let fee = escrow.fee;

        // PDA seeds for signing
        let listing_id = escrow.listing_id.clone();
        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.seller.as_ref(),
            listing_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        // 1. Transfer product amount to seller
        let transfer_to_seller_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(), // The escrow PDA is the authority
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_seller = CpiContext::new_with_signer(cpi_program.clone(), transfer_to_seller_accounts, signer);
        token::transfer(cpi_ctx_seller, amount)?;

        // 2. Transfer fee to treasury
        let transfer_to_treasury_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        };
        let cpi_ctx_treasury = CpiContext::new_with_signer(cpi_program, transfer_to_treasury_accounts, signer);
        token::transfer(cpi_ctx_treasury, fee)?;

        // Close the escrow account (optional, or mark as completed)
        // Here we just update state. In a real app we might close it to reclaim rent.
        escrow.state = EscrowState::Completed;

        Ok(())
    }

    pub fn refund_timeout(ctx: Context<RefundTimeout>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        require!(escrow.state == EscrowState::Initialized, ErrorCode::InvalidState);
        
        let current_time = Clock::get()?.unix_timestamp;
        let timeout = 14 * 24 * 60 * 60; // 14 days
        require!(current_time > escrow.created_at + timeout, ErrorCode::TimeoutNotReached);

        escrow.state = EscrowState::Refunded;

        // Refund amount to buyer. Fee might be kept or refunded depending on policy.
        // Spec says: "funds auto-refund to the buyer minus the fee".
        let amount = escrow.amount;
        let fee = escrow.fee;

        // PDA seeds for signing
        let listing_id = escrow.listing_id.clone();
        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.seller.as_ref(),
            listing_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        // 1. Transfer product amount back to buyer
        let transfer_to_buyer_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_buyer = CpiContext::new_with_signer(cpi_program.clone(), transfer_to_buyer_accounts, signer);
        token::transfer(cpi_ctx_buyer, amount)?;

        // 2. Transfer fee to treasury (policy: buyer pays fee for timeout? or maybe refund fee too? Spec says "minus the fee")
        // So fee goes to treasury.
        let transfer_to_treasury_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        };
        let cpi_ctx_treasury = CpiContext::new_with_signer(cpi_program, transfer_to_treasury_accounts, signer);
        token::transfer(cpi_ctx_treasury, fee)?;
        
        escrow.state = EscrowState::Cancelled;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, fee: u64, listing_id: String)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: This is the seller's public key
    pub seller: UncheckedAccount<'info>,
    
    #[account(
        init,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), listing_id.as_bytes()],
        bump,
        payer = buyer,
        space = 8 + 32 + 32 + 4 + listing_id.len() + 8 + 8 + 1 + 8 + 1
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = buyer,
        token::mint = mint,
        token::authority = escrow_account,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ConfirmDelivery<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", buyer.key().as_ref(), escrow_account.seller.as_ref(), escrow_account.listing_id.as_bytes()],
        bump = escrow_account.bump,
        has_one = buyer
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundTimeout<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>, // Can be triggered by buyer or anyone really, but let's say buyer/seller/anyone
    
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.buyer.as_ref(), escrow_account.seller.as_ref(), escrow_account.listing_id.as_bytes()],
        bump = escrow_account.bump,
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct EscrowAccount {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub listing_id: String,
    pub amount: u64,
    pub fee: u64,
    pub state: EscrowState,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowState {
    Initialized,
    Delivered,
    Completed,
    Refunded,
    Cancelled,
    Disputed,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Numerical Overflow")]
    NumericalOverflow,
    #[msg("Invalid Escrow State")]
    InvalidState,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Timeout Not Reached")]
    TimeoutNotReached,
}

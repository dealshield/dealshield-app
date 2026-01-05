import { supabase } from "@/utils/supabase/client";

export const checkMissedDeliveries = async () => {
  try {
    // 1. Fetch active orders that are not completed or cancelled
    // We filter for orders that are NOT completed, cancelled, or already marked as missed
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        created_at,
        status,
        delivery_started,
        accepted_at,
        listing:listings (
          id,
          delivery_time_hours,
          seller_wallet
        )
      `)
      .not("status", "in", "('completed','cancelled','cancelled_missed','refunded')");

    if (error) {
      console.error("Error fetching orders for delivery check:", error);
      return;
    }

    if (!orders || orders.length === 0) return;

    const now = new Date();
    const missedOrders = [];

    for (const order of orders) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listing = (order as any).listing;
      if (!listing) continue;

      // Only auto-cancel if delivery has NOT started
      // If delivery started, we let it stay 'pending' (overdue) until buyer confirms or claims refund
      if (order.delivery_started) continue;

      const deliveryHours = listing.delivery_time_hours || 24;
      // Use accepted_at if available (timer starts when seller accepts), otherwise created_at
      const startTime = order.accepted_at ? new Date(order.accepted_at) : new Date(order.created_at);
      const deadline = new Date(startTime.getTime() + deliveryHours * 60 * 60 * 1000);

      if (now > deadline) {
        missedOrders.push({
          orderId: order.id,
          listingId: listing.id,
          sellerWallet: listing.seller_wallet
        });
      }
    }

    // 2. Process missed orders
    if (missedOrders.length > 0) {
      console.log(`Found ${missedOrders.length} missed deliveries. Processing...`);
      
      for (const missed of missedOrders) {
        // Update order status
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: "cancelled_missed" })
          .eq("id", missed.orderId);

        if (orderError) {
          console.error(`Failed to update order ${missed.orderId}:`, orderError);
          continue;
        }

        // Update listing status back to active so it's visible again
        const { error: listingError } = await supabase
          .from("listings")
          .update({ status: "active" })
          .eq("id", missed.listingId);

        if (listingError) {
          console.error(`Failed to update listing ${missed.listingId}:`, listingError);
        }
      }
      console.log("Finished processing missed deliveries.");
    }

  } catch (err) {
    console.error("Error checking missed deliveries:", err);
  }
};

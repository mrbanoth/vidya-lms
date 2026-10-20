import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button, Card, Skeleton } from "@/components/ui";
import { get } from "@/lib/api";
import { money } from "@/lib/format";
import { useTitle } from "@/hooks/useTitle";

export default function CheckoutSuccess() {
  useTitle("Payment successful");
  const { orderId } = useParams();
  const { data: order } = useQuery({ queryKey: ["order", orderId], queryFn: () => get(`/orders/${orderId}`).then((r) => r.data) });
  return (
    <div className="container-page grid place-items-center py-16">
      <Card className="grid w-full max-w-lg justify-items-center gap-5 p-8 text-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-8" />
        </motion.span>
        <h1 className="text-3xl font-extrabold">{order?.total === 0 ? "You are enrolled" : "Payment successful"}</h1>
        {order ? (
          <>
            <p className="text-muted-foreground">
              {order.invoiceNo && <>Order <span className="font-mono">{order.invoiceNo}</span> · </>}
              {money(order.total)}. A receipt is on its way to {order.user.email}.
            </p>
            <ul className="grid w-full gap-2 rounded-xl bg-muted p-4 text-left text-sm">
              {order.items.map((i) => <li key={i.course._id || i.course} className="flex justify-between gap-3"><span>{i.title}</span><span className="text-muted-foreground">Lifetime access</span></li>)}
            </ul>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild><Link to={`/learn/${order.items[0].course._id || order.items[0].course}`}>Start learning</Link></Button>
              <Button variant="outline" asChild><Link to={`/orders/${order._id}`}>View invoice</Link></Button>
            </div>
          </>
        ) : (
          <Skeleton className="h-24 w-full" />
        )}
      </Card>
    </div>
  );
}

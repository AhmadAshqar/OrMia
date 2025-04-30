import ShoppingCart from "@/components/ShoppingCart";

export default function Cart() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif mb-8">סל הקניות</h1>
      <ShoppingCart />
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="relative h-[70vh] overflow-hidden animate-fadeIn">
      <div className="absolute inset-0 bg-black">
        <img 
          src="https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
          alt="תכשיטי יוקרה מויסנייט" 
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>
      
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-center">
        <h1 className="text-4xl md:text-6xl font-serif text-white mb-4">
          <span className="block mb-2">יופי נצחי.</span>
          <span className="block text-[hsl(var(--gold))]">מחיר ללא תחרות.</span>
        </h1>
        <p className="text-white text-xl md:text-2xl max-w-lg mb-8 font-accent">
          תכשיטי מויסנייט יוקרתיים בהתאמה אישית שמשאירים רושם לנצח.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-black px-8 py-6 font-medium text-lg"
          >
            <Link href="/category/all">
              גלה את הקולקציה
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-6 font-medium text-lg"
          >
            <Link href="/about">
              קרא עוד
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

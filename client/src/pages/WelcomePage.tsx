import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export default function WelcomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background via-background to-secondary/20 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h[800px] bg-primary/5 rounded-full blur-[150px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full space-y-8 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/40"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4"
        >
          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
              Nova AI
            </span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Assistant Intelligent pour tous vos besoins
          </p>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-base text-foreground/70 max-w-lg mx-auto leading-relaxed"
        >
          Conversez avec une IA généraliste puissante.
          Codage, rédaction, analyse et bien plus encore.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
        >
          <Button
            size="lg"
            onClick={() => setLocation("/login")}
            className="h-14 px-8 text-lg font-semibold bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
            data-testid="button-login"
          >
            Se connecter
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/signup")}
            className="h-14 px-8 text-lg font-semibold hover:scale-105 transition-transform active:scale-95"
            data-testid="button-signup"
          >
            Créer un compte
          </Button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-left"
        >
          {[
            { title: "Rapide", desc: "Réponses instantanées et précises" },
            { title: "Privé", desc: "Vos conversations vous appartiennent" },
            { title: "Intelligent", desc: "Comprend le contexte et votre histoire" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
            >
              <h3 className="font-semibold text-primary mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

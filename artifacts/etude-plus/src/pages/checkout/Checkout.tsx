import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Card, Button, Input, Label, FadeIn } from "@/components/ui/Premium";
import { ShieldCheck, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { formatTND } from "@/lib/utils";
import { useGetClass, useCheckout, useConfirmPayment } from "@workspace/api-client-react";

export function Checkout() {
  const [, params] = useRoute("/checkout/:id");
  const classId = Number(params?.id);
  const [, setLocation] = useLocation();

  const { data: cls, isLoading: isClassLoading, isError } = useGetClass(classId, { query: { enabled: !!classId } });
  const checkoutMutation = useCheckout();
  const confirmPaymentMutation = useConfirmPayment();

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [formError, setFormError] = useState("");

  const platformFee = (cls?.price ?? 0) * 0.15;
  const total = (cls?.price ?? 0) + platformFee;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      const checkoutRes = await checkoutMutation.mutateAsync({ data: { classId } });
      const transactionId = checkoutRes?.transactionId ?? checkoutRes?.id;
      if (!transactionId) throw new Error("Transaction non créée");
      await confirmPaymentMutation.mutateAsync({
        data: {
          transactionId,
          cardNumber: cardNumber.replace(/\s/g, ""),
          cardHolder,
          expiryDate,
          cvv,
        }
      });
      setLocation("/payment-success");
    } catch (err: any) {
      setFormError(err?.message ?? "Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const isSubmitting = checkoutMutation.isPending || confirmPaymentMutation.isPending;

  if (!classId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cours invalide.</p>
          <Link href="/student/browse"><Button className="mt-4">Parcourir les cours</Button></Link>
        </div>
      </div>
    );
  }

  if (isClassLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !cls) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Cours introuvable</h2>
          <p className="text-muted-foreground mb-4">Ce cours n'existe pas ou n'est plus disponible.</p>
          <Link href="/student/browse"><Button>Parcourir les cours</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 pt-24 pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <FadeIn>
          <h1 className="text-3xl font-serif font-bold mb-8">Finaliser l'inscription</h1>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3">
              <Card className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 border-b border-border pb-6">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold">Moyen de paiement</h2>
                </div>

                <form onSubmit={handlePay} className="space-y-5">
                  <div>
                    <Label>Numéro de carte</Label>
                    <Input
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      required
                      value={cardNumber}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setCardNumber(raw.replace(/(.{4})/g, "$1 ").trim());
                      }}
                    />
                  </div>
                  <div>
                    <Label>Nom sur la carte</Label>
                    <Input
                      placeholder="Nom complet"
                      required
                      value={cardHolder}
                      onChange={e => setCardHolder(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date d'expiration</Label>
                      <Input
                        placeholder="MM/AA"
                        maxLength={5}
                        required
                        value={expiryDate}
                        onChange={e => {
                          const v = e.target.value.replace(/[^0-9/]/g, "");
                          setExpiryDate(v.length === 2 && !v.includes("/") ? v + "/" : v);
                        }}
                      />
                    </div>
                    <div>
                      <Label>CVC</Label>
                      <Input
                        placeholder="123"
                        maxLength={4}
                        type="password"
                        required
                        value={cvv}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {formError}
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full mt-6" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Traitement...</> : `Payer ${formatTND(total)}`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    Paiement sécurisé crypté SSL
                  </div>
                </form>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-4">Résumé de la commande</h3>

                <div className="bg-secondary p-4 rounded-xl mb-6">
                  <p className="font-semibold">{cls.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Par {cls.professor?.fullName ?? "—"}
                  </p>
                </div>

                <div className="space-y-3 text-sm mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix du cours</span>
                    <span className="font-medium">{formatTND(cls.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais de plateforme (15%)</span>
                    <span className="font-medium">{formatTND(platformFee)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatTND(total)}</span>
                </div>

                <div className="mt-4 text-xs text-muted-foreground text-center">
                  Le professeur perçoit {formatTND(cls.price * 0.85)} (85%)
                </div>
              </Card>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

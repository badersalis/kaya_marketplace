import { Order, Hub } from "@prisma/client";

export type NotificationTemplate =
  | "intent_received"
  | "quote_request"
  | "logistics_quote_submitted"
  | "quote_sent"
  | "quote_accepted"
  | "paid_confirmed"
  | "handoff_confirmed"
  | "order_delivered"
  | "declined"
  | "unavailable";

type OrderWithHub = Order & { hub: Hub };

export function buildNotificationContent(template: NotificationTemplate, order: OrderWithHub) {
  const route = `${order.hub.city} → ${order.destinationCity}`;

  switch (template) {
    case "intent_received":
      return {
        title: `Votre demande a été reçue — ${order.reference}`,
        body: `Bonjour ${order.customerName}, votre demande pour "${order.productName}" (${route}) a bien été reçue. Nous revenons vers vous avec un devis très bientôt.`,
      };
    case "quote_request":
      return {
        title: `Nouvelle demande de cotation — ${order.reference}`,
        body: `Un nouveau colis nécessite votre cotation logistique : ${order.productName} (qté ${order.quantity}), ${route}. Merci de soumettre votre devis dès que possible.`,
      };
    case "logistics_quote_submitted":
      return {
        title: `Cotation logistique reçue — ${order.reference}`,
        body: `Le partenaire a soumis sa cotation logistique pour ${order.reference} (${order.productName}). Vous pouvez maintenant finaliser le devis client.`,
      };
    case "quote_sent":
      return {
        title: `Votre devis Kaya — ${order.reference}`,
        body: `Bonjour ${order.customerName}, votre devis pour "${order.productName}" (${route}) est prêt : ${order.customerQuoteTotal?.toLocaleString("fr-FR")} FCFA. Consultez et confirmez ici : /q/${order.quoteToken}`,
      };
    case "quote_accepted":
      return {
        title: `Devis accepté — ${order.reference}`,
        body: `${order.customerName} a accepté le devis pour ${order.reference} (${order.customerQuoteTotal?.toLocaleString("fr-FR")} FCFA). Contactez-le pour finaliser le paiement, puis marquez la commande payée.`,
      };
    case "paid_confirmed":
      return {
        title: `Commande confirmée — préparez ${order.reference}`,
        body: `Le paiement pour ${order.reference} (${order.productName}, ${route}) est confirmé. Préparez la prise en charge dès réception au hub.`,
      };
    case "handoff_confirmed":
      return {
        title: `Colis prêt pour prise en charge — ${order.reference}`,
        body: `Le colis ${order.reference} (${order.productName}) a été confirmé au hub de ${order.hub.city} et est prêt à être pris en charge pour livraison à ${order.destinationCity}. Client : ${order.customerName} (${order.customerPhone}).`,
      };
    case "order_delivered":
      return {
        title: `Colis livré — ${order.reference}`,
        body: `Bonne nouvelle ${order.customerName}, votre colis ${order.reference} (${order.productName}) a été livré avec succès à ${order.destinationCity}.`,
      };
    case "declined":
      return {
        title: `Devis refusé — ${order.reference}`,
        body: `Le client a refusé le devis pour ${order.reference} (${order.productName}).`,
      };
    case "unavailable":
      return {
        title: `Article indisponible — ${order.reference}`,
        body: `Bonjour ${order.customerName}, nous sommes désolés, "${order.productName}" n'est plus disponible chez le revendeur.`,
      };
  }
}

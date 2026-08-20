import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion — Kaya",
  description: "Connectez-vous à votre espace Kaya.",
};

export default function SignIn() {
  return <SignInForm />;
}

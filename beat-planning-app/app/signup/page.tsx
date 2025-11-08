import SignupForm from "../../components/signup-form"

export const metadata = {
  title: "Sign up",
}

export default function SignupPage() {
  return (
    <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <SignupForm />
      </div>
    </div>
  )
}

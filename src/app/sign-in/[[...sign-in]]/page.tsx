import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<SignIn 
				appearance={{
					elements: {
						formButtonPrimary: "bg-primary hover:bg-primary/90",
						card: "shadow-lg",
					}
				}}
			/>
		</div>
	)
} 
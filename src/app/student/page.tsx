export default function StudentPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Student Renters</h1>
      <p className="mb-6">Join the waitlist and get early access when listings go live near you.</p>

      <iframe
        src="https://docs.google.com/forms/d/e/your-google-form-id/viewform?embedded=true"
        width="100%"
        height="600"
        frameBorder="0"
      >
        Loading…
      </iframe>
    </div>
  );
}

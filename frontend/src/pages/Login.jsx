import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Card, ErrorText } from "../components/ui";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(loginId, password);
      if (user.role === "admin") navigate("/seo");
      else navigate("/user-dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl">
            <img
              src="/admin/favicon.svg"
              alt="Logo"
              className="h-10 w-20 object-contain"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Report System</h1>
          <p className="mt-1 text-base text-ink/50">Sign in with the credentials you were given</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Login ID"
              type="text"
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <ErrorText>{error}</ErrorText>
            <Button type="submit" variant="orange" className="w-full h-12 text-sm" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-base text-ink/50">
          <span className="text-orange-500 font-bold">Don't have an account?</span> Ask your administrator for a login ID and password.
        </p>
      </div>
    </div>
  );
}

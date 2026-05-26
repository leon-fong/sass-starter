import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json(null);
  }

  return Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
}

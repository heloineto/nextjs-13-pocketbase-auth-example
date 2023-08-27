import { cookies } from 'next/headers';
import { logout } from '../actions';

export default function Page() {
  const cookie = cookies().get('pb_auth');

  // This never happens because of the middleware,
  // but we must make typescript happy
  if (!cookie) throw new Error('Not logged in');

  const { model } = JSON.parse(cookie.value);

  return (
    <main>
      <p>This is the dashboard. Only logged-in users can view this route</p>
      <p>Logged-in user: </p>
      <pre>{JSON.stringify(model, null, 2)}</pre>
      <form action={logout}>
        <button type="submit">logout</button>
      </form>
    </main>
  );
}

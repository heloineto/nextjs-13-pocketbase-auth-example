# Next.js 13 Authentication with PocketBase

This document will teach you how to use PocketBase Authentication using Cookies with Next.js 13 app directory without any client components


## Next.js Setup

If you haven't already, create a new Next.js using the official docs: https://nextjs.org/docs/getting-started/installation

As of 08/27/2023, server actions are a experimental feature, so you'll need to enable it by adding the following to your `next.config.js` file:

```js
// ./next.config.js

module.exports = {
  // ...
  experimental: {
    serverActions: true,
  },
};
```
## PocketBase Setup

Install PocketBase following the official docs: https://pocketbase.io/docs/.

Run your pocketbase instance and create a environment variable called `POCKETBASE_URL` with your PocketBase URL.

```bash
# ./.env.development

POCKETBASE_URL=http://127.0.0.1:8090
```

Notice that we don't have to prefix the environment variable with `NEXT_PUBLIC_`. This is because we do everything in the server and we never expose the PocketBase URL to the client. Feels good.

## Login flow

To handle the login on the server we create a [server action](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations#how-server-actions-work) to handle the form submission. We also create a logout server action to handle the logout.

```ts
// ./app/actions.ts

'use server';

import { redirect } from 'next/navigation';
import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // TODO: server-side validation

  const pb = new PocketBase(process.env.POCKETBASE_URL);

  const { token, record: model } = await pb
    .collection('users')
    .authWithPassword(email, password);

  const cookie = JSON.stringify({ token, model });

  cookies().set('pb_auth', cookie, {
    secure: true,
    path: '/',
    sameSite: 'strict',
    httpOnly: true,
  });

  redirect('/dashboard');
}

export async function logout() {
  cookies().delete('pb_auth');
  redirect('/');
}
```

For the form, create a very simple page with a login form. Pass the `login` server action to the form's `action` prop.

```tsx
// ./app/page.tsx

import { login } from './actions';
import classes from './page.module.css';

export default function Page() {
  return (
    <main>
      Login form
      <form action={login}>
        <label>
          E-mail
          <input name="email" type="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" />
        </label>
        <button type="submit">Login</button>
      </form>
    </main>
  );
}
```

## Private routes

Now we'll create a private route called `/dashboard`. Only authenticated users should be able to access this route.

We will also add a form with a single button for the user to logout. Passing the `logout` server action to the form's `action` prop.

Notice that we can also get the user's model from the cookie and display it on the page.

```tsx
// ./app/dashboard.tsx

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
```

Now, to ensure that only authenticated users can access the `/dashboard` route, we'll create a middleware that checks if the user is logged in. If the user is not logged in, we redirect them to the login page.

```ts
// ./middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { isTokenExpired } from 'pocketbase';

export function middleware(request: NextRequest) {
  // You can also export a `config.matcher` array,
  // but i believe this way is more straightforward and scalable.
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('pb_auth');
    const token = authCookie?.value ? JSON.parse(authCookie.value).token : null;

    // If there's no token or it's expired, redirect to login page.
    if (!token || isTokenExpired(token)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }
}

// Read more about Next.js middleware in: https://nextjs.org/docs/app/building-your-application/routing/middleware
```

And that's it! now you have a fully functional authentication system with PocketBase and Next.js 13. No client components, no client-side javascript, blazingly fast.
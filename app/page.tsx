import { login } from './actions';
import classes from './page.module.css';

export default function Page() {
  return (
    <main className={classes.main}>
      Login form
      <form className={classes.form} action={login}>
        <label className={classes.label}>
          E-mail
          <input name="email" type="email" />
        </label>
        <label className={classes.label}>
          Password
          <input name="password" type="password" />
        </label>
        <button type="submit">Login</button>
      </form>
    </main>
  );
}

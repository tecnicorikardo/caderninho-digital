import styles from './styles.module.css';

export function Login() {

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Lógica de login virá aqui
    console.log('Formulário enviado');
  }

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <header>
          <h1>Caderninho Digital</h1>
          <p>Gerencie seu negócio de forma fácil e eficiente.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              placeholder="********"
              required
            />
          </div>

          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}
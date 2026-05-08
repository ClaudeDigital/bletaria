function CoffeeCupSVG() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 010 8h-1"/>
      <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/>
      <line x1="6" y1="2" x2="6" y2="4"/>
      <line x1="10" y1="2" x2="10" y2="4"/>
      <line x1="14" y1="2" x2="14" y2="4"/>
    </svg>
  )
}

export default function DonatePage() {
  const methods = [
    {
      icon: '🏦',
      title: 'Transfertë Bankare',
      details: [
        { label: 'Banka', value: 'Banka Ekonomike' },
        { label: 'Emri', value: 'Bletaria Ime SH.P.K' },
        { label: 'IBAN', value: 'XK05 1234 5678 9012 3456' },
      ],
    },
    {
      icon: '💳',
      title: 'PayPal',
      details: [
        { label: 'Email', value: 'donate@bletariaime.com' },
      ],
      link: 'https://paypal.me/bletariaime',
      linkLabel: 'Dërgoni via PayPal',
    },
    {
      icon: '₿',
      title: 'Crypto',
      details: [
        { label: 'Bitcoin (BTC)', value: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
        { label: 'Ethereum (ETH)', value: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
      ],
    },
  ]

  const amounts = [2, 5, 10, 20, 50]

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '720px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
          <div style={{
            width: '80px', height: '80px',
            borderRadius: '50%',
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid rgba(245,166,35,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <CoffeeCupSVG />
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--gold)' }}>
            Mbështet me një Kafe
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--muted)', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
            Bletaria Ime është falas për të gjithë bletarët. Me mbështetjen tuaj
            vazhdojmë të zhvillojmë funksione të reja dhe mbajmë platformën aktive.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {['Hosting', 'Zhvillim', 'Aplikacioni', 'AI Asistent'].map(tag => (
              <span key={tag} style={{
                background: 'rgba(245,166,35,0.08)', color: 'var(--gold)',
                padding: '0.3rem 0.8rem', borderRadius: '20px',
                fontSize: '0.82rem', fontWeight: 600, border: '1px solid rgba(245,166,35,0.2)',
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Suggested amounts */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700, color: 'var(--text)' }}>Sa kafe dëshiron të bësh?</h2>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {amounts.map(a => (
              <div key={a} style={{
                padding: '0.6rem 1.2rem',
                border: '1.5px solid var(--gold)',
                borderRadius: '30px',
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--gold)',
                background: 'rgba(245,166,35,0.07)',
                cursor: 'default',
              }}>€{a}</div>
            ))}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
            Çdo kontribut, sado i vogël, ndihmon platformën të qëndrojë falas për të gjithë.
          </p>
        </div>

        {/* Payment methods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {methods.map(m => (
            <div key={m.title} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{m.title}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {m.details.map(d => (
                  <div key={d.label} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--muted)', minWidth: '110px' }}>{d.label}:</span>
                    <code style={{
                      background: 'var(--surface)', padding: '0.15rem 0.5rem',
                      borderRadius: '4px', fontSize: '0.82rem',
                      color: 'var(--text)', wordBreak: 'break-all',
                    }}>{d.value}</code>
                  </div>
                ))}
              </div>
              {m.link && (
                <a href={m.link} target="_blank" rel="noopener noreferrer"
                  className="btn btn-primary btn-sm" style={{ marginTop: '0.85rem', display: 'inline-flex' }}>
                  {m.linkLabel} →
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Thank you */}
        <div style={{
          textAlign: 'center', padding: '2rem',
          background: 'rgba(245,166,35,0.05)',
          border: '1px solid rgba(245,166,35,0.15)',
          borderRadius: 'var(--radius)', marginBottom: '3rem',
        }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Faleminderit për mbështetjen!</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
            Çdo donacion shkon drejtpërdrejt për të mbajtur platformën aktive dhe për të shtuar
            funksione të reja. Bashkë ndërtojmë komunitetin më të mirë të bletarëve në Kosovë dhe Shqipëri.
          </p>
        </div>

      </div>
    </div>
  )
}

export default function PageHead({ title, subtitle, actions }) {
  return (
    <div className="page-head" data-animate>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

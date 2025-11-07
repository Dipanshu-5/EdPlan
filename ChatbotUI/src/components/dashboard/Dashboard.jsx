const Dashboard = () => {
  const university = {
    name: 'UNM University',
    location: 'New Mexico, USA',
    established: 1889,
    accreditation: 'Higher Learning Commission'
  };

  const stats = [
    { label: 'Programs', value: '120' },
    { label: 'Education Plans', value: '15' },
    { label: 'Students', value: '25k+' },
    { label: 'Faculty', value: '1.5k' }
  ];

  return (
    <section className="grid gap-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{university.name}</h3>
        <p className="text-sm text-slate-500">
          {university.location} · Est. {university.established}
        </p>
        <p className="text-sm text-slate-500">Accreditation: {university.accreditation}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1"
          >
            <span className="text-xs uppercase text-slate-500 tracking-wide">{stat.label}</span>
            <span className="text-2xl font-semibold text-slate-900">{stat.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Dashboard;

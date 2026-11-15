// Cálculo da carga horária (RN05): soma das horasValidas
// apenas das participações em oficinas REALIZADAS.
function totalHoras(participacoes) {
  return participacoes
    .filter((p) => p.oficina && p.oficina.status === 'REALIZADA')
    .reduce((soma, p) => soma + p.horasValidas, 0);
}

module.exports = { totalHoras };

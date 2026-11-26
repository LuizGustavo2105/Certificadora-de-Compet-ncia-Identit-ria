// Desenha o PDF do Termo de Voluntariado com o pdfkit e devolve um Buffer.
const PDFDocument = require('pdfkit');

const FUSO = 'America/Sao_Paulo';
const formatarData = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: FUSO });
const formatarDataHora = (d) =>
  new Date(d).toLocaleString('pt-BR', { timeZone: FUSO, dateStyle: 'short', timeStyle: 'short' });
const formatarHoras = (h) => `${h.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} h`;
const PAPEL = { MINISTRANTE: 'Ministrante', APOIO: 'Apoio' };

// dados: { voluntario, atividades, totalHoras, emitidoEm, emitidoPor, hash, urlValidacao }
function gerarPdfTermo(dados) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56, info: { Title: 'Termo de Voluntariado - ELLP' } });
    const partes = [];
    doc.on('data', (p) => partes.push(p));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    const { voluntario: v } = dados;
    const largura = doc.page.width - 112;

    // Cabeçalho
    doc.font('Helvetica').fontSize(10).fillColor('#555')
      .text('Universidade Tecnológica Federal do Paraná — Câmpus Cornélio Procópio', { align: 'center' })
      .text('Projeto de Extensão ELLP', { align: 'center' });
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#000').text('TERMO DE VOLUNTARIADO', { align: 'center' });
    doc.moveDown(1.5);

    // Texto principal
    const identificacao = [v.ra && `RA ${v.ra}`, v.curso].filter(Boolean).join(', ');
    let periodo = '';
    if (v.dataEntrada) {
      periodo = ` no período de ${formatarData(v.dataEntrada)}`;
      periodo += v.dataSaida ? ` a ${formatarData(v.dataSaida)}` : ` até a data de emissão deste termo`;
    }
    doc.font('Helvetica').fontSize(12).text(
      `Certificamos que ${v.nome}${identificacao ? ` (${identificacao})` : ''} atuou como voluntário(a) ` +
        `no Projeto de Extensão ELLP${periodo}, totalizando ${formatarHoras(dados.totalHoras)} ` +
        `de atividades, conforme a relação abaixo.`,
      { align: 'justify', lineGap: 4 },
    );
    doc.moveDown(1.5);

    // Tabela de atividades
    const colunas = [
      { titulo: 'Data', largura: 80 },
      { titulo: 'Oficina', largura: largura - 80 - 90 - 60 },
      { titulo: 'Papel', largura: 90 },
      { titulo: 'Horas', largura: 60 },
    ];
    const desenharLinha = (valores, negrito) => {
      const y = doc.y;
      let x = 56;
      doc.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
      const alturas = valores.map((valor, i) =>
        doc.heightOfString(valor, { width: colunas[i].largura - 8 }));
      const altura = Math.max(...alturas) + 8;
      if (y + altura > doc.page.height - 120) doc.addPage();
      const yLinha = doc.y;
      valores.forEach((valor, i) => {
        doc.text(valor, x + 4, yLinha + 4, { width: colunas[i].largura - 8 });
        x += colunas[i].largura;
      });
      doc.moveTo(56, yLinha + altura).lineTo(56 + largura, yLinha + altura).strokeColor('#ccc').stroke();
      doc.x = 56;
      doc.y = yLinha + altura;
    };
    desenharLinha(colunas.map((c) => c.titulo), true);
    dados.atividades.forEach((a) =>
      desenharLinha([formatarData(a.oficina.data), a.oficina.tema, PAPEL[a.papel] || a.papel, formatarHoras(a.horasValidas)]));
    desenharLinha(['', 'Total', '', formatarHoras(dados.totalHoras)], true);

    // Emissão e validação
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(11).fillColor('#000')
      .text(`Emitido em ${formatarDataHora(dados.emitidoEm)} por ${dados.emitidoPor}.`, 56, doc.y, { width: largura });
    doc.moveDown(1.5);
    doc.font('Helvetica-Bold').fontSize(10).text('Código de validação (SHA-256):');
    doc.font('Courier').fontSize(9).text(dados.hash);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10)
      .text('Confira a autenticidade deste termo em: ', { continued: true })
      .fillColor('#1a56db').text(dados.urlValidacao, { link: dados.urlValidacao, underline: true });

    doc.end();
  });
}

module.exports = { gerarPdfTermo };

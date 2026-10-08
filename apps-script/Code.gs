/**
 * BriefArq — recebe as respostas dos formulários e grava na planilha.
 *
 * Cada briefing (título) vira uma aba; cada envio vira uma linha.
 * Reenvios do mesmo cliente (mesmo "ID do envio") atualizam a linha em vez de duplicar.
 * Imagens anexadas vão para o Drive, em "BriefArq - anexos/<briefing> - <nome>".
 *
 * Instalação: ver README.md na raiz do repositório.
 */

const ANEXOS_ROOT = 'BriefArq - anexos';
const FIXOS = ['Enviado em', 'Nome', 'Anexos', 'ID do envio'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const p = JSON.parse(e.postData.contents);
    const sheet = abaDoBriefing(p.title || 'Briefing');
    const perguntas = p.answers.map(a => (a.n + '. ' + (a.q || '')).trim());
    const headers = garantirCabecalho(sheet, FIXOS.concat(perguntas));

    const valores = {
      'Enviado em': new Date(),
      'Nome': texto(p.name),
      'Anexos': salvarImagens(p),
      'ID do envio': p.sid,
    };
    p.answers.forEach((a, i) => { valores[perguntas[i]] = texto(a.a); });
    const linha = headers.map(h => (h in valores ? valores[h] : ''));

    const existente = linhaDoEnvio(sheet, headers.indexOf('ID do envio') + 1, p.sid);
    if (existente) sheet.getRange(existente, 1, 1, linha.length).setValues([linha]);
    else sheet.appendRow(linha);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Abrir a URL /exec no navegador deve mostrar {"ok":true} — serve para testar a implantação.
function doGet() {
  return json({ ok: true });
}

function abaDoBriefing(titulo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const nome = titulo.replace(/[\[\]*?\/\\:]/g, ' ').trim().slice(0, 100) || 'Briefing';
  return ss.getSheetByName(nome) || ss.insertSheet(nome);
}

// Cria o cabeçalho na primeira resposta; se o briefing ganhar perguntas novas, acrescenta colunas no fim.
function garantirCabecalho(sheet, desejado) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, desejado.length).setValues([desejado]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return desejado;
  }
  const atual = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const faltando = desejado.filter(h => atual.indexOf(h) < 0);
  if (faltando.length) {
    sheet.getRange(1, atual.length + 1, 1, faltando.length).setValues([faltando]).setFontWeight('bold');
  }
  return atual.concat(faltando);
}

function linhaDoEnvio(sheet, coluna, sid) {
  const ultima = sheet.getLastRow();
  if (!sid || coluna < 1 || ultima < 2) return 0;
  const ids = sheet.getRange(2, coluna, ultima - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === sid) return i + 2;
  return 0;
}

// Grava as imagens numa pasta por envio e devolve o link da pasta ('' se não houver imagem).
function salvarImagens(p) {
  const comImagem = p.answers.filter(a => a.imgs && a.imgs.length);
  if (!comImagem.length) return '';

  const raiz = pasta(DriveApp.getRootFolder(), ANEXOS_ROOT);
  const destino = pasta(raiz, (p.title || 'Briefing') + ' - ' + (p.name || 'cliente') + ' - ' + p.sid);
  // reenvio: substitui os anexos anteriores
  const antigos = destino.getFiles();
  while (antigos.hasNext()) antigos.next().setTrashed(true);

  comImagem.forEach(a => a.imgs.forEach((dataUrl, i) => {
    const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
    if (!m) return;
    const ext = m[1].split('/')[1] || 'jpg';
    const nome = 'P' + String(a.n).padStart(2, '0') + '-' + (i + 1) + '.' + ext;
    destino.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nome));
  }));
  return destino.getUrl();
}

function pasta(pai, nome) {
  const it = pai.getFoldersByName(nome);
  return it.hasNext() ? it.next() : pai.createFolder(nome);
}

// Impede que respostas começando com = + - @ sejam interpretadas como fórmula.
function texto(v) {
  const s = v == null ? '' : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

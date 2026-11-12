const login = document.querySelector('#login');
const loginForm = document.querySelector('#login-form');
const loginStatus = document.querySelector('#login-status');
const adminContent = document.querySelector('#admin-content');
const sessionKey = 'belen-demo-access';
const sessionLength = 4 * 60 * 60 * 1000;
let expiryTimer;

function renderSession() {
  const remaining = Number(sessionStorage.getItem(sessionKey)) - Date.now();
  const signedIn = remaining > 0 && remaining <= sessionLength;
  login.hidden = signedIn;
  adminContent.hidden = !signedIn;
  clearTimeout(expiryTimer);
  if (signedIn) expiryTimer = setTimeout(renderSession, remaining + 10);
}

async function verifyPassword(password) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const params = { name: 'PBKDF2', salt: encoder.encode('belen-nievas-cvstudio-demo-v1'), iterations: 210000, hash: 'SHA-256' };
  const bits = await crypto.subtle.deriveBits(params, key, 256);
  const digest = Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
  return digest === 'b2aef3768e22651d81a39601d6ee6fd7545a7426f5a08ffcc6303d15f33bb354';
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const { username, password } = loginForm.elements;
  const submit = loginForm.querySelector('button');
  submit.disabled = true;
  try {
    if (username.value.trim() !== 'Admin' || !(await verifyPassword(password.value))) {
      loginStatus.textContent = 'El usuario o la contraseña no coinciden.';
      return;
    }
    sessionStorage.setItem(sessionKey, String(Date.now() + sessionLength));
    password.value = '';
    loginStatus.textContent = '';
    renderSession();
    document.querySelector('#settings-form input').focus();
  } catch {
    loginStatus.textContent = 'No se pudo ingresar. Abrí la demo por HTTPS e intentá de nuevo.';
  } finally {
    submit.disabled = false;
  }
});
document.querySelector('#logout').addEventListener('click', () => {
  sessionStorage.removeItem(sessionKey);
  renderSession();
  loginForm.elements.username.focus();
});
renderSession();

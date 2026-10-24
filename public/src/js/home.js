import { AUTHENDPOINT } from './endpoints.js';
import { setUserId, setUserName, setUserRootAccess, setUserAuthKey } from './user.js';

let mode = 'login';
let nextCard = 2;

const card = document.getElementById('authCard');
const title = document.getElementById('title');
const eyebrow = document.getElementById('eyebrow');
const dot = document.getElementById('dot');
const username = document.getElementById('username');
const password = document.getElementById('password');
const confirmField = document.getElementById('confirmField');
const confirm = document.getElementById('confirm');
const msg = document.getElementById('msg');
const submitBtn = document.getElementById('submitBtn');
const switchPrompt = document.getElementById('switchPrompt');
const switchLink = document.getElementById('switchLink');
const toggleVis = document.getElementById('toggleVis');
const accession = document.getElementById('accession');
const stamp = document.getElementById('stamp');

const colors = { login: 'var(--rust)', signup: 'var(--teal)' };

function setMsg(text, ok) {
    msg.textContent = text || '';
    msg.classList.toggle('ok', !!ok);
}

function render() {
    setMsg('');
    stamp.classList.remove('show');
    if (mode === 'login') {
        title.textContent = 'Sign In';
        eyebrow.textContent = 'Wall access · returning reader';
        submitBtn.textContent = 'Sign in';
        switchPrompt.textContent = 'No card on file yet?';
        switchLink.textContent = 'Create one';
        confirmField.style.display = 'none';
        dot.style.background = colors.login;
        card.style.setProperty('--rust', '#a73b2a');
    } else {
        title.textContent = 'New Account';
        eyebrow.textContent = 'Wall access · new reader';
        submitBtn.textContent = 'Create account';
        switchPrompt.textContent = 'Already have a card?';
        switchLink.textContent = 'Sign in instead';
        confirmField.style.display = 'block';
        dot.style.background = colors.signup;
    }
}

switchLink.addEventListener('click', () => {
    mode = mode === 'login' ? 'signup' : 'login';
    password.value = '';
    confirm.value = '';
    render();
    username.focus();
});

toggleVis.addEventListener('click', () => {
    const showing = password.type === 'text';
    password.type = showing ? 'password' : 'text';
    confirm.type = password.type;
    toggleVis.textContent = showing ? 'show' : 'hide';
});

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.textContent;
    submitBtn.textContent = isLoading ? 'Please wait…' : submitBtn.dataset.originalText;
}

async function sendAuthRequest(payload) {
    const response = await fetch(AUTHENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Request failed with status ' + response.status);
    }

    return response.json();
}

card.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = username.value.trim();
    const p = password.value;

    if (!u || !p) {
        setMsg('Fill in both fields to continue.');
        return;
    }
    if (u.length < 3) {
        setMsg('Username needs at least 3 characters.');
        return;
    }
    if (p.length < 6) {
        setMsg('Password needs at least 6 characters.');
        return;
    }

    if (mode === 'signup') {
        const c = confirm.value;
        if (p !== c) {
            setMsg('Passwords don\u2019t match.');
            return;
        }

        const payload = {
            login: false,
            username: u,
            password: p
        };

        setLoading(true);
        try {
            const data = await sendAuthRequest(payload);
            if (data.success) {
                accession.textContent = 'no. ' + String(nextCard++).padStart(3, '0');
                setMsg('Card filed. You can sign in now.', true);
                stamp.classList.add('show');
                setTimeout(() => {
                    mode = 'login';
                    password.value = '';
                    confirm.value = '';
                    render();
                    username.value = u;
                    password.focus();
                }, 900);
            } else {
                setMsg(data.message || 'That username is already filed. Try signing in.');
            }
        } catch (err) {
            setMsg('Something went wrong reaching the server. Try again.');
        } finally {
            setLoading(false);
        }
        return;
    }

    const payload = {
        login: true,
        username: u,
        password: p
    };

    setLoading(true);
    try {
        const data = await sendAuthRequest(payload);
        if (data.success) {
            setUserId(data.data.user.id);
            setUserName(data.data.user.username);
            setUserRootAccess(data.data.user.root);
            setUserAuthKey(data.data.user.auth_key);
            setMsg('Welcome back, ' + u + '.\n\n' + 'Your wall is ' + window.location.href + data.data.user.username + '.', true);
            stamp.classList.add('show');
        } else {
            setMsg(data.message || 'That password doesn\u2019t match our records.');
        }
    } catch (err) {
        setMsg('Something went wrong reaching the server. Try again.');
    } finally {
        setLoading(false);
    }
});

render();
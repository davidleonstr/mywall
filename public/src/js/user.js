export function getUserId() {
    return localStorage.getItem('mywall-temp-id');
}

export function getUserRootAccess() {
    return localStorage.getItem('mywall-temp-root');
}

export function getUserAuthKey() {
    return localStorage.getItem('mywall-temp-auth-key');
}

export function setUserId(id) {
    localStorage.setItem('mywall-temp-id', id);
}

export function setUserName(name) {
    localStorage.setItem('mywall-temp-username', name);
}

export function setUserRootAccess(flag) {
   localStorage.setItem('mywall-temp-root', flag); 
}

export function setUserAuthKey(key) {
    localStorage.setItem('mywall-temp-auth-key', key);
}
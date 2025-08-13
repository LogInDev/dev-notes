let Store = null;

let service = {
	//edmsHost: 'http://edmdev.skhynix.com/edms/jsp/portalService.jsp' //비밀문서함 WEB 개발 주소
	edmsHost: 'http://edms.skhynix.com/edms/jsp/portalService.jsp' //비밀문서함 WEB 운영 주소
};

export function saveStore(createdStore) {
    Store = createdStore;

    return Store;
}
export function getStore() {
    return Store;
}

export function getService() {
	return service;
}

export function getProfile() {
	return Store.getState().profile.profile;
}

export function getChannels() {
	return Store.getState().channel;
}

export function getMessages() {
	return Store.getState().messages;
}

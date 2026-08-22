import { Api } from './api.js';

let currentUser = null;
let selectedInterestIds = [];

export const Session = {
  async hydrate() {
    try {
      const [session, interests] = await Promise.all([Api.getSession(), Api.getInterests()]);
      currentUser = session.user;
      selectedInterestIds = interests.selectedIds || [];
      return true;
    } catch {
      currentUser = null;
      selectedInterestIds = [];
      return false;
    }
  },
  setUser(user) { currentUser = user; },
  clear() { currentUser = null; selectedInterestIds = []; },
  getUser() { return currentUser; },
  getInterestIds() { return selectedInterestIds; },
  setInterestIds(ids) { selectedInterestIds = ids; },
};

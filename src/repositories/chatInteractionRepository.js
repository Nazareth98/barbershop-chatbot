// chatInteractionRepository.js
let chatInteractionRepository = [];

export function getChatInteractionRepository() {
  return chatInteractionRepository;
}

export function setChatInteractionRepository(newRepository) {
  chatInteractionRepository = newRepository;
}

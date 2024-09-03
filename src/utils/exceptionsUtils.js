export const getExceptionMessage = (type, arg) => {
  switch (type) {
    case "outGroup":
      return `A solicitação de *${arg}* deve ser realizada dentro de um grupo autorizado.`;
    default:
      return `Desculpe não entendi...`;
  }
};

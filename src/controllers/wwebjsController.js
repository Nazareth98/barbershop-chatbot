import {
  getGroupsService,
  filterGroupsService,
  updateGroupsService,
  sendMessageService,
} from "../../services/wweb.js";

export const getGroupsController = async (req, res) => {
  try {
    const result = await getGroupsService();
    return res.status(200).json({
      message: "Grupos atualizados com sucesso!",
      result,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateGroupsController = (req, res) => {
  const params = req.params;
  const body = req.body;

  try {
    const result = updateGroupsService(params, body);

    return res.status(200).json({
      message: "Grupos modificados com sucesso!",
      result: result,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const sendToGroupController = (req, res) => {
  const { message, groups } = req.body;
  try {
    groups.forEach((group) => {
      sendMessageService(group.groupId, message);
    });

    res.status(200).json({ message: "Taxas enviadas com sucesso!" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

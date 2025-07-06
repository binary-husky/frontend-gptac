export interface UserInterfaceMsg {
  function: string;
  main_input: string;
  llm_kwargs: Record<string, any>;
  plugin_kwargs: Record<string, any>;
  chatbot: string[][];
  history: string[];
  system_prompt: string;
  user_request: string;
  special_kwargs: Record<string, any>;
}



// 定义消息类型接口
export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

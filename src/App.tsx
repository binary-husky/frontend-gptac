// 导入必要的React钩子
import { useState, useRef, useEffect } from 'react'
import { begin_contact_websocket_server } from './bridge';
import useWebSocket from './ws';
import UpdateElectron from '@/components/update'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'
import { UserInterfaceMsg, ChatMessage } from './Com'
import { Input, ConfigProvider, Space, Button, List, Avatar, Layout, Card, Row, Col } from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined
} from '@ant-design/icons';
import './App.css';

const { Header, Content, Footer } = Layout;

// 主应用组件
function App() {
  const MainUserComInterface = useRef<UserInterfaceMsg>(
    {
      function: 'chat',
      main_input: '',
      llm_kwargs: {},
      plugin_kwargs: {},
      chatbot: [],
      history: [],
      system_prompt: '',
      user_request: '',
      special_kwargs: {}
    }
  )

  const [ui_maininput, set_ui_maininput] = useState('');                  // 输入框的值

  // 状态管理
  const [count, setCount] = useState(0)                                   // 计数器状态（未使用）
  const [connectionStatus, setConnectionStatus] = useState(0)             // WebSocket连接状态
  const [url, setUrl] = useState('ws://localhost:28000/main');            // WebSocket服务器地址
  const [messages, setMessages] = useState<ChatMessage[]>([]);            // 聊天消息历史记录
  const messagesEndRef = useRef(null);                                    // 用于自动滚动到底部的引用


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    (messagesEndRef.current as unknown as HTMLDivElement)?.scrollIntoView({ behavior: "smooth" });
  };

  // 处理输入框值的变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_ui_maininput(e.target.value);
    MainUserComInterface.current.main_input = e.target.value;
  };

  // 处理发送消息的函数
  const handleSendMessage = async () => {

    begin_contact_websocket_server({
      initial_message: MainUserComInterface.current,
      url: url,
      receive_callback_fn: (parsedMessage: UserInterfaceMsg) => {
        console.log('Received message:', parsedMessage);
        const botMessage = parsedMessage.chatbot;
        const new_message_list: ChatMessage[] = [];
        for (const conversation of botMessage) {
          new_message_list.push(
            { sender: 'user' as const, text: conversation[0] },  // a_say
            { sender: 'bot' as const, text: conversation[1] }   // b_say
          );
        }
        setMessages(new_message_list);
        // set history
        MainUserComInterface.current.history = parsedMessage.history;
      }
    });


  };


  // 渲染UI界面
  return (
    // 主容器，设置为全屏且溢出隐藏
    <div className="App overflow-hidden h-screen w-screen flex flex-col">
      {/* Ant Design 主题配置 */}
      <ConfigProvider
        theme={{
          token: {
            // Seed Token
            colorPrimary: '#00b96b',
            // borderRadius: 2,
            // Alias Token
            // colorBgContainer: '#f6ffed',
          },
        }}
      >
        <div className="p-[5px]">
          <Layout className="layout">
            <Content className="content">
              {/* 聊天内容容器 */}
              <Card className="chat-container flex-grow overflow-y-auto h-screen pb-[40px]">
                <List
                  className="message-list "
                  itemLayout="horizontal"
                  dataSource={messages}
                  renderItem={(item, index) => (
                    <List.Item className={`message-item ${item.sender}`}>
                      <List.Item.Meta
                        className='m-0'
                        avatar={
                          item.sender === 'bot' ? (
                            <Avatar icon={<RobotOutlined />} className="bot-avatar" />
                          ) : (
                            <Avatar icon={<UserOutlined />} className="user-avatar" />
                          )
                        }
                        // title={item.sender === 'bot' ? '助手' : '你'}
                        description={<ReactMarkdown remarkPlugins={[remarkGfm]}>{item.text}</ReactMarkdown>}
                      />
                    </List.Item>
                  )}
                />
                <div ref={messagesEndRef} />
              </Card>
              {/* 底部输入区域 */}
              <Row className="input-container fixed bottom-5 w-[80%] left-[10%] right-[10%] p-[5px]" gutter={8}>
                <Col flex="auto">
                  <Input
                    placeholder="输入消息..."
                    value={ui_maininput}
                    onChange={handleInputChange}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    className="message-input"
                  />
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleSendMessage()}
                    className="send-button"
                  >
                    发送
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="default"
                    onClick={() => setMessages([])}
                    className="clear-button"
                  >
                    清除
                  </Button>
                </Col>
              </Row>
            </Content>
          </Layout>
        </div>
      </ConfigProvider>
    </div>
  )
}

export default App

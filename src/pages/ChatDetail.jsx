import { saveAs } from 'file-saver';
import { useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BiMessageAltDetail, BiMessageDetail } from "react-icons/bi";
import { FaCheck, FaCopy, FaEdit, FaFileDownload, FaRegThumbsDown, FaRegThumbsUp } from "react-icons/fa";
import { IoImage, IoMic, IoRefresh, IoSend, IoVolumeMute, IoVolumeHigh } from "react-icons/io5";
import { RiDeleteBin6Line, RiHeartFill, RiHeartLine, RiShareLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import IconMenu from "../assets/menu.png";
import UserAvatar from "../assets/nmbvsylxgzcq3uppsfiu.png";
import SideBar from "../components/SideBar";
import { useTheme } from "../context/ThemeContext";
import Gemini from "../gemini/index";
import { addBotMessage, addChat, addUserMessage, removeChat, setNameChat } from "../store/chatSlice/index";

const ROBOT_IMG_URL = "https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg";

// Kiểm tra script ResponsiveVoice đã được tải chưa
const isResponsiveVoiceLoaded = () => {
  return typeof window !== 'undefined' && window.responsiveVoice && typeof window.responsiveVoice.speak === 'function';
};

// Tải ResponsiveVoice script
const loadResponsiveVoice = () => {
  return new Promise((resolve) => {
    if (isResponsiveVoiceLoaded()) {
      resolve(true);
      return;
    }
    
    // Kiểm tra xem script đã được thêm vào trang chưa
    const existingScript = document.querySelector('script[src*="responsivevoice.js"]');
    if (existingScript) {
      console.log("ResponsiveVoice script đã tồn tại, chờ load...");
      // Đặt timeout để đợi script khởi tạo
      setTimeout(() => {
        if (isResponsiveVoiceLoaded()) {
          console.log("ResponsiveVoice đã được tải thành công qua script hiện có");
          resolve(true);
        } else {
          console.error("Script tồn tại nhưng không load được ResponsiveVoice");
          resolve(false);
        }
      }, 1000);
      return;
    }
    
    const script = document.createElement('script');
    // Sử dụng HTTPS và thêm callback parameter để xử lý CORS
    script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=2Zt4KMgU&cb=' + Date.now();
    script.async = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      console.log("ResponsiveVoice đã được tải");
      resolve(true);
    };
    
    script.onerror = (error) => {
      console.error("Không thể tải ResponsiveVoice:", error);
      
      // Thử lại với CDN dự phòng
      const backupScript = document.createElement('script');
      backupScript.src = 'https://cdn.jsdelivr.net/npm/responsivevoice@1.8.3/dist/responsivevoice.min.js';
      backupScript.async = true;
      backupScript.crossOrigin = "anonymous";
      
      backupScript.onload = () => {
        console.log("ResponsiveVoice đã được tải từ CDN dự phòng");
        resolve(true);
      };
      
      backupScript.onerror = () => {
        console.error("Không thể tải ResponsiveVoice từ tất cả nguồn");
        resolve(false);
      };
      
      document.body.appendChild(backupScript);
    };
    
    document.body.appendChild(script);
  });
};

// API Google Cloud TTS (không yêu cầu key, sử dụng qua proxy công khai)
const GOOGLE_TTS_URL = "https://translate.google.com/translate_tts";

// Tạo URL proxy để tránh lỗi CORS
const getProxyUrl = (url) => {
  // Sử dụng CORS Anywhere hoặc thay thế bằng proxy của riêng bạn
  return `https://cors-anywhere.herokuapp.com/${url}`;
  // Hoặc sử dụng các dịch vụ proxy CORS thay thế
  // return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  // return `https://corsproxy.io/?${encodeURIComponent(url)}`;
};

// Helper cho việc phát âm tiếng Việt
const googleTextToSpeech = {
  // Phát hiện ngôn ngữ từ văn bản
  detectLanguage: (text) => {
    // Đếm ký tự tiếng Việt
    const vietnameseChars = 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
    const vietnameseCharsUppercase = vietnameseChars.toUpperCase();
    const allVietnameseChars = vietnameseChars + vietnameseCharsUppercase;
    
    let vietnameseCharCount = 0;
    for (let i = 0; i < text.length; i++) {
      if (allVietnameseChars.includes(text[i])) {
        vietnameseCharCount++;
      }
    }
    
    // Nếu có đủ ký tự tiếng Việt, xác định là tiếng Việt
    if (vietnameseCharCount > 0) {
      return 'vi-VN';
    }
    
    // Kiểm tra ngôn ngữ khác
    const koreanRegex = /[\uAC00-\uD7AF]/;
    const chineseRegex = /[\u4E00-\u9FFF]/;
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
    
    if (koreanRegex.test(text)) return 'ko-KR';
    if (chineseRegex.test(text)) return 'zh-CN';
    if (japaneseRegex.test(text)) return 'ja-JP';
    
    // Mặc định là tiếng Anh
    return 'en-US';
  },

  // Chuẩn bị URL cho phát âm Google TTS
  getSpeechUrl: (text, lang = null) => {
    // Google TTS giới hạn độ dài - chia nhỏ nếu > 150 ký tự
    if (text.length > 150) {
      text = text.substring(0, 150);
    }
    
    // Phát hiện ngôn ngữ nếu không được cung cấp
    if (!lang) {
      lang = googleTextToSpeech.detectLanguage(text);
    }
    
    const encodedText = encodeURIComponent(text);
    // Tạo URL
    return `${GOOGLE_TTS_URL}?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;
  },
  
  // Phát âm sử dụng ResponsiveVoice
  speakWithResponsiveVoice: async (text, detectedLanguage) => {
    if (!isResponsiveVoiceLoaded()) {
      await loadResponsiveVoice();
      if (!isResponsiveVoiceLoaded()) return false;
    }
    
    // Ánh xạ ngôn ngữ phát hiện được sang giọng ResponsiveVoice
    let voice = "Vietnamese Female"; // Mặc định tiếng Việt
    
    if (detectedLanguage.startsWith('en')) {
      voice = "US English Female";
    } else if (detectedLanguage.startsWith('zh')) {
      voice = "Chinese Female";
    } else if (detectedLanguage.startsWith('ja')) {
      voice = "Japanese Female";
    } else if (detectedLanguage.startsWith('ko')) {
      voice = "Korean Female";
    }
    
    // Chia thành các câu để phát âm tốt hơn
    const sentences = text.split(/[.!?;]/).filter(s => s.trim().length > 0);
    
    return new Promise(async (resolve) => {
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (sentence.length === 0) continue;
        
        try {
          // Đọc từng câu và đợi hoàn thành
          await new Promise((res) => {
            window.responsiveVoice.speak(sentence, voice, {
              pitch: 1,
              rate: 1,
              volume: 1,
              onend: res
            });
          });
        } catch (error) {
          console.error("Lỗi khi phát âm câu:", sentence, error);
        }
      }
      
      resolve(true);
    });
  },

  // Phát âm tiếng Việt bằng mSpeak (thư viện đơn giản phát âm tiếng Việt)
  speakVietnameseWithMSpeak: async (text) => {
    try {
      // Kiểm tra xem mSpeak đã được load chưa
      if (typeof window.mSpeak === 'undefined') {
        // Tạo script element để load mSpeak
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/minhhungit/mspeak@master/dist/mspeak.min.js';
        script.async = true;
        
        // Đợi script tải xong
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        
        // Đợi 500ms để chắc chắn mSpeak đã khởi tạo
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Kiểm tra lại mSpeak đã load chưa
      if (typeof window.mSpeak === 'undefined') {
        console.error("Không thể tải thư viện mSpeak");
        return false;
      }
      
      // Chia nhỏ đoạn văn bản thành các câu
      const sentences = text.split(/[.!?;]/).filter(s => s.trim().length > 0);
      
      for (const sentence of sentences) {
        if (sentence.trim().length === 0) continue;
        
        // Sử dụng mSpeak để đọc tiếng Việt
        window.mSpeak.speak(sentence.trim());
        
        // Đợi một khoảng thời gian ước tính để mSpeak đọc xong
        // mSpeak không có callback onEnd
        const estimatedTime = sentence.trim().length * 80; // ước tính 80ms cho mỗi ký tự
        await new Promise(resolve => setTimeout(resolve, estimatedTime));
      }
      
      return true;
    } catch (error) {
      console.error("Lỗi khi sử dụng mSpeak:", error);
      return false;
    }
  },
  
  // Phát âm với dữ liệu âm thanh tổng hợp
  speakWithAudioData: async (text, lang = 'vi-VN') => {
    try {
      // Chia nhỏ đoạn văn bản
      const sentences = text.split(/[.!?;]/).filter(s => s.trim().length > 0);
      
      // Mảng lưu trữ các promise phát âm
      const audioPromises = [];
      
      for (const sentence of sentences) {
        if (sentence.trim().length === 0) continue;
        
        // Tạo URL cho Google TTS
        const url = googleTextToSpeech.getSpeechUrl(sentence.trim(), lang);
        
        // Tạo audio element
        const audio = new Audio();
        
        // Sử dụng proxy để tránh lỗi CORS
        const proxyUrl = getProxyUrl(url);
        audio.src = proxyUrl;
        audio.crossOrigin = "anonymous";
        
        // Tạo promise phát âm
        const playPromise = new Promise((resolve, reject) => {
          audio.onended = resolve;
          audio.onerror = (e) => {
            console.error("Lỗi phát âm:", e);
            reject(e);
          };
          
          // Thử phát âm
          audio.play().catch(err => {
            console.warn("Lỗi khi phát audio:", err);
            reject(err);
          });
        });
        
        audioPromises.push(playPromise);
      }
      
      // Đợi tất cả audio phát xong
      await Promise.allSettled(audioPromises);
      return true;
    } catch (error) {
      console.error("Lỗi khi phát âm với Audio API:", error);
      return false;
    }
  },
  
  // Phương thức chính để phát âm trực tiếp với Google TTS 
  speakWithGoogleTTS: async (text, lang = null) => {
    try {
      if (!text || text.trim().length === 0) return false;
      
      // Phát hiện ngôn ngữ nếu không được cung cấp
      if (!lang) {
        lang = googleTextToSpeech.detectLanguage(text);
      }
      
      // Chuẩn bị đoạn văn bản
      const sentences = text.split(/[.!?;]/).filter(sentence => sentence.trim().length > 0);
      
      // Phát âm từng câu một
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence.length === 0) continue;
        
        // Tạo URL cho phát âm Google TTS
        const url = googleTextToSpeech.getSpeechUrl(trimmedSentence, lang);
        
        try {
          // Sử dụng fetch API với proxy để tải dữ liệu âm thanh - tránh CORS
          const proxyUrl = getProxyUrl(url);
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Chuyển đổi phản hồi thành blob âm thanh
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Phát âm thanh và đợi hoàn thành
          const audio = new Audio(audioUrl);
          
          await new Promise((resolve, reject) => {
            audio.onended = () => {
              URL.revokeObjectURL(audioUrl); // Giải phóng bộ nhớ
              resolve();
            };
            audio.onerror = (e) => {
              URL.revokeObjectURL(audioUrl);
              reject(e);
            };
            audio.play().catch(err => {
              URL.revokeObjectURL(audioUrl);
              console.error("Lỗi phát audio:", err);
              reject(err);
            });
          });
        } catch (error) {
          console.error("Lỗi khi sử dụng Google TTS:", error);
          // Tiếp tục với câu tiếp theo mặc dù có lỗi
        }
      }
      
      return true;
    } catch (error) {
      console.error("Lỗi khi sử dụng Google TTS:", error);
      return false;
    }
  },
  
  // Phát âm sử dụng Google TTS
  speak: async (text) => {
    if (!text || text.trim().length === 0) return false;
    
    try {
      // Chuẩn bị văn bản
      text = text.replace(/<[^>]*>/g, '');
      
      // Phát hiện ngôn ngữ từ văn bản
      const detectedLanguage = googleTextToSpeech.detectLanguage(text);
      console.log("Ngôn ngữ được phát hiện:", detectedLanguage);
      
      // Thử sử dụng ResponsiveVoice trước
      const responsiveVoiceSuccess = await googleTextToSpeech.speakWithResponsiveVoice(text, detectedLanguage);
      if (responsiveVoiceSuccess) {
        return true;
      }

      // Nếu là tiếng Việt, thử với mSpeak - thư viện phát âm tiếng Việt
      if (detectedLanguage === 'vi-VN') {
        const mSpeakSuccess = await googleTextToSpeech.speakVietnameseWithMSpeak(text);
        if (mSpeakSuccess) {
          return true;
        }
      }

      // Thử sử dụng Google TTS qua proxy
      if (detectedLanguage === 'vi-VN') {
        try {
          const googleTTSSuccess = await googleTextToSpeech.speakWithGoogleTTS(text, detectedLanguage);
          if (googleTTSSuccess) {
            return true;
          }
        } catch (error) {
          console.error("Lỗi khi sử dụng Google TTS qua proxy:", error);
        }
      }
      
      // Sử dụng dự phòng với audioData nếu các cách trên không thành công
      if (detectedLanguage === 'vi-VN') {
        try {
          const audioDataSuccess = await googleTextToSpeech.speakWithAudioData(text, detectedLanguage);
          if (audioDataSuccess) {
            return true;
          }
        } catch (error) {
          console.error("Lỗi khi sử dụng Audio Data:", error);
        }
      }

      // Do vấn đề CORS, chúng ta sẽ sử dụng SpeechSynthesis API thay thế
      if (window.speechSynthesis) {
        // Chia thành các câu nhỏ
        const sentences = text.split(/[.!?;]/).filter(s => s.trim().length > 0);
        
        // Tạo queue các đoạn cần đọc
        const utterances = [];
        
        sentences.forEach(sentence => {
          if (sentence.trim().length === 0) return;
          
          const utterance = new SpeechSynthesisUtterance(sentence.trim());
          utterance.lang = detectedLanguage;
          
          // Tìm giọng phù hợp với ngôn ngữ
          const voices = window.speechSynthesis.getVoices();
          const languageCode = detectedLanguage.split('-')[0]; // Lấy phần đầu (vi, en, ja...)
          
          // Ưu tiên tìm giọng phù hợp với ngôn ngữ
          const matchingVoice = voices.find(voice => 
            voice.lang === detectedLanguage || 
            voice.lang.startsWith(languageCode + '-')
          );
          
          if (matchingVoice) {
            utterance.voice = matchingVoice;
          }
          
          // Tối ưu hóa tốc độ và pitch cho trải nghiệm tốt hơn
          if (detectedLanguage === 'vi-VN') {
            utterance.rate = 0.9; // Chậm hơn một chút cho tiếng Việt
            utterance.pitch = 1.0;
          } else {
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
          }
          
          utterances.push(utterance);
        });
        
        // Thiết lập phát tuần tự các utterance
        return new Promise((resolve) => {
          let currentIndex = 0;
          
          const speakNext = () => {
            if (currentIndex < utterances.length) {
              const currentUtterance = utterances[currentIndex];
              currentIndex++;
              
              currentUtterance.onend = speakNext;
              currentUtterance.onerror = () => {
                console.error("Lỗi khi phát âm câu:", currentIndex - 1);
                speakNext(); // Tiếp tục với câu tiếp theo nếu lỗi
              };
              
              try {
                window.speechSynthesis.speak(currentUtterance);
              } catch (error) {
                console.error("Lỗi khi phát âm:", error);
                speakNext();
              }
            } else {
              resolve(true);
            }
          };
          
          speakNext();
        });
      }
      
      return false; // Không thể sử dụng SpeechSynthesis
    } catch (error) {
      console.error("Lỗi khi sử dụng TTS:", error);
      return false;
    }
  },
  
  // Làm sạch văn bản
  cleanText: (text) => {
    // Loại bỏ HTML
    let clean = text.replace(/<[^>]*>/g, '');
    
    // Thay thế khoảng trắng thừa
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
  }
};

// Hàm hỗ trợ phát âm tiếng Việt
const vietnameseSpeechHelper = {
  // Phân tích và chuyển đổi văn bản tiếng Việt thành các phần nhỏ hơn
  prepareVietnameseText: (text) => {
    // Xử lý các dấu câu để đảm bảo nghỉ đúng
    let processedText = text
      .replace(/\./g, '. ')
      .replace(/\!/g, '! ')
      .replace(/\?/g, '? ')
      .replace(/\,/g, ', ');
    
    // Chia thành các câu nhỏ để phát âm tốt hơn
    const sentences = processedText.split(/[.!?]/).filter(s => s.trim().length > 0);
    
    // Đảm bảo mỗi câu không quá dài
    const optimizedSentences = [];
    sentences.forEach(sentence => {
      // Chia câu dài thành các phần khoảng 10-15 từ
      const words = sentence.trim().split(/\s+/);
      for (let i = 0; i < words.length; i += 12) {
        const chunk = words.slice(i, i + 12).join(' ');
        if (chunk.trim().length > 0) {
          optimizedSentences.push(chunk.trim());
        }
      }
    });
    
    return optimizedSentences;
  },
  
  // Điều chỉnh đặc biệt cho tiếng Việt khi không có voice tiếng Việt
  pronounceVietnamese: (utterance, voice) => {
    // Điều chỉnh tốc độ để phát âm chậm hơn với từ tiếng Việt
    utterance.rate = 0.9;
    
    // Nếu sử dụng giọng tiếng Anh, cần điều chỉnh để phát âm tốt hơn
    if (voice && voice.lang.startsWith('en')) {
      // Các giọng tiếng Anh thường phát âm tốt hơn với pitch thấp hơn một chút
      utterance.pitch = 0.9;
    }
    
    return utterance;
  },
  
  // Tạo pronunciation guide cho các từ tiếng Việt phổ biến
  createPronunciationMap: () => {
    // Map các từ/âm tiết tiếng Việt sang cách đọc gần đúng bằng tiếng Anh
    // Điều này giúp giọng nói tiếng Anh đọc tiếng Việt nghe tự nhiên hơn
    return {
      // Nguyên âm và thanh điệu
      'à': 'ah',
      'á': 'ah',
      'ả': 'ah',
      'ã': 'ah',
      'ạ': 'ah',
      'ă': 'a',
      'ằ': 'a',
      'ắ': 'a',
      'ẳ': 'a',
      'ẵ': 'a',
      'ặ': 'a',
      'â': 'uh',
      'ầ': 'uh',
      'ấ': 'uh',
      'ẩ': 'uh',
      'ẫ': 'uh',
      'ậ': 'uh',
      'è': 'eh',
      'é': 'eh',
      'ẻ': 'eh',
      'ẽ': 'eh',
      'ẹ': 'eh',
      'ê': 'ay',
      'ề': 'ay',
      'ế': 'ay',
      'ể': 'ay',
      'ễ': 'ay',
      'ệ': 'ay',
      'ì': 'ee',
      'í': 'ee',
      'ỉ': 'ee',
      'ĩ': 'ee',
      'ị': 'ee',
      'ò': 'oh',
      'ó': 'oh',
      'ỏ': 'oh',
      'õ': 'oh',
      'ọ': 'oh',
      'ô': 'oh',
      'ồ': 'oh',
      'ố': 'oh',
      'ổ': 'oh',
      'ỗ': 'oh',
      'ộ': 'oh',
      'ơ': 'uh',
      'ờ': 'uh',
      'ớ': 'uh',
      'ở': 'uh',
      'ỡ': 'uh',
      'ợ': 'uh',
      'ù': 'oo',
      'ú': 'oo',
      'ủ': 'oo',
      'ũ': 'oo',
      'ụ': 'oo',
      'ư': 'oo',
      'ừ': 'oo',
      'ứ': 'oo',
      'ử': 'oo',
      'ữ': 'oo',
      'ự': 'oo',
      'ỳ': 'ee',
      'ý': 'ee',
      'ỷ': 'ee',
      'ỹ': 'ee',
      'ỵ': 'ee',
      
      // Các từ phổ biến
      'không': 'kohng',
      'có': 'koh',
      'được': 'dook',
      'người': 'ngooee',
      'tôi': 'toy',
      'bạn': 'ban',
      'và': 'vah',
      'là': 'lah',
      'của': 'kua',
      'cho': 'choh',
      'trong': 'chong',
      'này': 'nay',
    };
  },
  
  // Chuyển đổi văn bản để giọng tiếng Anh đọc dễ hiểu hơn
  optimizeForNonVietnameseVoice: (text) => {
    const pronunciationMap = vietnameseSpeechHelper.createPronunciationMap();
    
    // Thay thế các từ/ký tự dựa trên bảng phát âm
    let optimizedText = text;
    Object.keys(pronunciationMap).forEach(vietnameseWord => {
      const englishPronunciation = pronunciationMap[vietnameseWord];
      // Tạo regex để tìm từng từ riêng biệt
      const regex = new RegExp(`\\b${vietnameseWord}\\b`, 'gi');
      optimizedText = optimizedText.replace(regex, englishPronunciation);
      
      // Xử lý các ký tự đơn lẻ (như dấu)
      if (vietnameseWord.length === 1) {
        optimizedText = optimizedText.replace(
          new RegExp(vietnameseWord, 'g'), 
          englishPronunciation
        );
      }
    });
    
    return optimizedText;
  }
};

// Hàm định dạng câu trả lời từ Gemini
const formatResponse = (text) => {
  if (!text) return "";
  
  // Định dạng code blocks
  let formattedText = text.replace(
    /```([a-z]*)\n([\s\S]*?)\n```/g, 
    '<pre class="bg-gray-800 text-gray-100 p-3 my-2 rounded-md overflow-x-auto"><code>$2</code></pre>'
  );
  
  // Định dạng inline code
  formattedText = formattedText.replace(
    /`([^`]+)`/g, 
    '<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">$1</code>'
  );

  // Định dạng tiêu đề
  formattedText = formattedText.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-3">$1</h1>');
  formattedText = formattedText.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold my-2">$1</h2>');
  formattedText = formattedText.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold my-2">$1</h3>');
  
  // Định dạng danh sách có thứ tự
  formattedText = formattedText.replace(
    /^\d+\.\s(.+)$/gm,
    '<li class="ml-6 list-decimal">$1</li>'
  );
  
  // Định dạng danh sách không thứ tự
  formattedText = formattedText.replace(
    /^[*-]\s(.+)$/gm,
    '<li class="ml-6 list-disc">$1</li>'
  );
  
  // Gom các thẻ li liền nhau vào danh sách
  formattedText = formattedText.replace(
    /(<li[^>]*>.*?<\/li>)(?:\s*)(<li[^>]*>.*?<\/li>)/gs,
    '<ul class="my-2">$1$2</ul>'
  );
  
  // Định dạng đoạn văn
  formattedText = formattedText.replace(/^(?!<[a-z]).+$/gm, '<p class="my-2">$&</p>');
  
  // Loại bỏ thẻ p cho các dòng trống
  formattedText = formattedText.replace(/<p class="my-2"><\/p>/g, '<br />');
  
  // Định dạng bảng
  // Bắt đầu bảng
  formattedText = formattedText.replace(
    /\|(.+?)\|\s*\n\|(?:[-:\|]+)\|\s*\n/g,
    '<table class="w-full border-collapse border border-gray-300 my-4"><thead><tr>$1</tr></thead><tbody>'
  );
  
  // Các hàng trong bảng
  formattedText = formattedText.replace(
    /\|(.+?)\|\s*\n(?!\|(?:[-:\|]+)\|)/g,
    '<tr>$1</tr>'
  );
  
  // Kết thúc bảng
  formattedText = formattedText.replace(
    /<tr>(.+?)<\/tr>/g,
    (match) => {
      return match.replace(/\|(.+?)\|/g, '<td class="border border-gray-300 px-2 py-1">$1</td>');
    }
  );
  
  // Đóng thẻ bảng
  formattedText = formattedText.replace(/<tbody><\/tbody>/g, '</tbody></table>');
  
  // Định dạng liên kết
  formattedText = formattedText.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Định dạng đoạn văn bản in đậm và in nghiêng
  formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formattedText = formattedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  return formattedText;
};

const ChatDetail = () => {
  const [menuToggle, setMenuToggle] = useState(true);
  const [dataDetail, setDataDetail] = useState([]);
  const [messageDetail, setMessageDetail] = useState([]);
  const [inputChat, setInputChat] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [likedMessages, setLikedMessages] = useState({});
  const [expandedMessages, setExpandedMessages] = useState({});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const { id } = useParams();
  const { data } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const sidebarRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const suggestedPrompts = [
    "Viết đoạn văn mô tả về biển Việt Nam",
    "Giải thích cách hoạt động của trí tuệ nhân tạo",
    "Đề xuất 5 ý tưởng về lập trình web",
    "Viết một đoạn code mẫu bằng JavaScript"
  ];
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const recognitionRef = useRef(null);
  const [recognitionLang, setRecognitionLang] = useState('vi-VN');
  const supportedLanguages = [
    { code: 'vi-VN', name: 'Tiếng Việt' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'zh-CN', name: 'Chinese' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'ru-RU', name: 'Russian' },
  ];
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speechVoice, setSpeechVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const synthesisRef = useRef(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [useGoogleTTS, setUseGoogleTTS] = useState(true);
  const audioQueueRef = useRef([]);
  // Trong hàm ChatDetail, thêm state cho proxy CORS
  const [corsProxyUrl, setCorsProxyUrl] = useState("https://corsproxy.io/?");
  
  // Tạo URL proxy để tránh lỗi CORS - hàm này sử dụng corsProxyUrl từ state
  const getProxyUrl = (url) => {
    // Kiểm tra proxy dạng AllOrigins (cần encode URL)
    if (corsProxyUrl.includes('allorigins') || corsProxyUrl.includes('htmldriven')) {
      return `${corsProxyUrl}${encodeURIComponent(url)}`;
    }
    // Proxy dạng thông thường
    return `${corsProxyUrl}${url}`;
  };
  
  // Override phương thức Google TTS để sử dụng corsProxyUrl hiện tại
  useEffect(() => {
    // Ghi đè phương thức speakWithAudioData
    const originalSpeakWithAudioData = googleTextToSpeech.speakWithAudioData;
    googleTextToSpeech.speakWithAudioData = async (text, lang = 'vi-VN') => {
      try {
        // Chia nhỏ đoạn văn bản
        const sentences = text.split(/[.!?;]/).filter(s => s.trim().length > 0);
        
        // Mảng lưu trữ các promise phát âm
        const audioPromises = [];
        
        for (const sentence of sentences) {
          if (sentence.trim().length === 0) continue;
          
          // Tạo URL cho Google TTS
          const url = googleTextToSpeech.getSpeechUrl(sentence.trim(), lang);
          
          // Tạo audio element
          const audio = new Audio();
          
          // Sử dụng proxy để tránh lỗi CORS - sử dụng hàm getProxyUrl nội bộ
          const proxyUrl = getProxyUrl(url);
          audio.src = proxyUrl;
          audio.crossOrigin = "anonymous";
          
          // Tạo promise phát âm
          const playPromise = new Promise((resolve, reject) => {
            audio.onended = resolve;
            audio.onerror = (e) => {
              console.error("Lỗi phát âm:", e);
              reject(e);
            };
            
            // Thử phát âm
            audio.play().catch(err => {
              console.warn("Lỗi khi phát audio:", err);
              reject(err);
            });
          });
          
          audioPromises.push(playPromise);
        }
        
        // Đợi tất cả audio phát xong
        await Promise.allSettled(audioPromises);
        return true;
      } catch (error) {
        console.error("Lỗi khi phát âm với Audio API:", error);
        return false;
      }
    };
    
    // Ghi đè phương thức speakWithGoogleTTS
    const originalSpeakWithGoogleTTS = googleTextToSpeech.speakWithGoogleTTS;
    googleTextToSpeech.speakWithGoogleTTS = async (text, lang = null) => {
      try {
        if (!text || text.trim().length === 0) return false;
        
        // Phát hiện ngôn ngữ nếu không được cung cấp
        if (!lang) {
          lang = googleTextToSpeech.detectLanguage(text);
        }
        
        // Chuẩn bị đoạn văn bản
        const sentences = text.split(/[.!?;]/).filter(sentence => sentence.trim().length > 0);
        
        // Phát âm từng câu một
        for (const sentence of sentences) {
          const trimmedSentence = sentence.trim();
          if (trimmedSentence.length === 0) continue;
          
          // Tạo URL cho phát âm Google TTS
          const url = googleTextToSpeech.getSpeechUrl(trimmedSentence, lang);
          
          try {
            // Sử dụng fetch API với proxy để tải dữ liệu âm thanh - tránh CORS 
            // Sử dụng hàm getProxyUrl nội bộ
            const proxyUrl = getProxyUrl(url);
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Chuyển đổi phản hồi thành blob âm thanh
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Phát âm thanh và đợi hoàn thành
            const audio = new Audio(audioUrl);
            
            await new Promise((resolve, reject) => {
              audio.onended = () => {
                URL.revokeObjectURL(audioUrl); // Giải phóng bộ nhớ
                resolve();
              };
              audio.onerror = (e) => {
                URL.revokeObjectURL(audioUrl);
                reject(e);
              };
              audio.play().catch(err => {
                URL.revokeObjectURL(audioUrl);
                console.error("Lỗi phát audio:", err);
                reject(err);
              });
            });
          } catch (error) {
            console.error("Lỗi khi sử dụng Google TTS:", error);
            // Tiếp tục với câu tiếp theo mặc dù có lỗi
          }
        }
        
        return true;
      } catch (error) {
        console.error("Lỗi khi sử dụng Google TTS:", error);
        return false;
      }
    };
    
    // Cleanup khi component unmount
    return () => {
      googleTextToSpeech.speakWithAudioData = originalSpeakWithAudioData;
      googleTextToSpeech.speakWithGoogleTTS = originalSpeakWithGoogleTTS;
    };
  }, [corsProxyUrl]);

  useEffect(() => {
    if (data && id) {
      const updatedChat = data.find(chat => chat.id === id);
      if (updatedChat) {
        setDataDetail(updatedChat);
        setMessageDetail(updatedChat.messages || []);
      }
    }
  }, [data, id]);

  // Preload mSpeak for Vietnamese pronunciation
  useEffect(() => {
    // Preload mSpeak library for Vietnamese speech
    const preloadMSpeak = async () => {
      try {
        if (typeof window.mSpeak === 'undefined') {
          console.log('Preloading mSpeak library for Vietnamese speech...');
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/gh/minhhungit/mspeak@master/dist/mspeak.min.js';
          script.async = true;
          
          document.head.appendChild(script);
          
          // Don't await - let it load in background
          script.onload = () => {
            console.log('mSpeak library loaded successfully!');
          };
          
          script.onerror = (error) => {
            console.error('Failed to load mSpeak library:', error);
          };
        }
      } catch (error) {
        console.error('Error preloading mSpeak:', error);
      }
    };
    
    preloadMSpeak();
  }, []);

  // Kiểm tra và xóa chat rỗng khi điều hướng đi
  useEffect(() => {
    // Không còn cần cleanup function để xóa chat rỗng
    // vì chúng ta muốn giữ lại chat mới dù chưa có tin nhắn nào
  }, []);

  // Thêm một effect mới để kiểm tra liệu chat mới có đang hoạt động không
  useEffect(() => {
    if (id && id !== 'info') {
      // Đánh dấu chat này là đang hoạt động để không bị xóa
      const currentChat = data.find(chat => chat.id === id);
    }
  }, [id, data]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageDetail, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setMenuToggle(false);
      }
    };

    if (menuToggle) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuToggle]);

  // Remove debug console log blocks
  useEffect(() => {
    // Check localStorage directly
    const persistedRoot = localStorage.getItem('persist:root');
    if (persistedRoot) {
      try {
        const parsedData = JSON.parse(persistedRoot);
      } catch (e) {
        console.error("Error parsing localStorage data:", e);
      }
    }
  }, [data]);

  // Thêm kiểm tra hỗ trợ cho Web Speech API
  useEffect(() => {
    // Kiểm tra trình duyệt có hỗ trợ Speech Recognition không
    const checkSpeechRecognitionSupport = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('Trình duyệt này không hỗ trợ Web Speech API');
        return false;
      }
      return true;
    };
    
    const isSupported = checkSpeechRecognitionSupport();
    if (!isSupported) {
      setRecordingError('Trình duyệt của bạn không hỗ trợ thu âm giọng nói. Hãy thử Chrome hoặc Edge.');
    }
  }, []);

  // Khởi tạo SpeechSynthesis và lấy danh sách giọng nói
  useEffect(() => {
    // Kiểm tra SpeechSynthesis hỗ trợ
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis;
      
      // Lấy danh sách giọng nói
      const getVoices = () => {
        const voiceList = synthesisRef.current.getVoices();
        setAvailableVoices(voiceList);
        
        // Tìm giọng nói tiếng Việt
        if (voiceList.length > 0) {
          // Tìm giọng Tiếng Việt theo thứ tự ưu tiên
          const vietnameseVoice = 
            voiceList.find(voice => voice.lang === 'vi-VN') || 
            voiceList.find(voice => voice.lang.includes('vi')) ||
            voiceList.find(voice => voice.name.includes('Vietnam')) ||
            voiceList.find(voice => voice.name.includes('vi-'));
          
          if (vietnameseVoice) {
            console.log("Đã tìm thấy giọng tiếng Việt:", vietnameseVoice.name);
            setSpeechVoice(vietnameseVoice);
          } else {
            // Tìm giọng phù hợp thay thế
            // Ưu tiên tìm các giọng tiếng Anh Google hoặc Microsoft (thường chất lượng tốt)
            const googleEnVoice = voiceList.find(voice => voice.name.includes('Google') && (voice.lang === 'en-US' || voice.lang === 'en-GB'));
            const microsoftEnVoice = voiceList.find(voice => voice.name.includes('Microsoft') && (voice.lang === 'en-US' || voice.lang === 'en-GB'));
            const anyEnglishVoice = voiceList.find(voice => voice.lang.startsWith('en'));
            
            // Nếu không có tiếng Anh, thử với các giọng ngôn ngữ khác
            const googleVoice = voiceList.find(voice => voice.name.includes('Google'));
            const microsoftVoice = voiceList.find(voice => voice.name.includes('Microsoft'));
            
            // Chọn giọng theo thứ tự ưu tiên
            const selectedVoice = googleEnVoice || microsoftEnVoice || anyEnglishVoice || googleVoice || microsoftVoice || voiceList[0];
            
            console.log("Không tìm thấy giọng tiếng Việt, sử dụng:", selectedVoice.name);
            setSpeechVoice(selectedVoice);
          }
        }
      };
      
      // Chrome yêu cầu sự kiện voiceschanged
      if (synthesisRef.current.onvoiceschanged !== undefined) {
        synthesisRef.current.onvoiceschanged = getVoices;
      }
      
      getVoices();
      
      // Gọi getVoices sau một khoảng thời gian để đảm bảo danh sách giọng nói đã được tải
      setTimeout(getVoices, 1000);
    }
  }, []);

  // Tải ResponsiveVoice khi component được tạo
  useEffect(() => {
    loadResponsiveVoice();
  }, []);

  const handleChatDetail = async () => {
    if (!inputChat.trim()) return;

    const currentMessage = inputChat;
    setInputChat(""); // Clear input ngay lập tức

    if (id && id !== 'info') {
      // Thêm tin nhắn người dùng ngay lập tức
      dispatch(addUserMessage({
        idChat: id,
        userMess: currentMessage
      }));

      // Also update local state immediately 
      setMessageDetail(prevMessages => [
        ...prevMessages,
        {
          id: uuidv4(),
          text: currentMessage,
          isBot: false
        }
      ]);

      // Hiển thị loading state
      setIsLoading(true);

      // Thêm hiệu ứng typing (mô phỏng)
      setIsTyping(true);

      // Xử lý bot response
      try {
        const chatText = await Gemini(currentMessage, messageDetail);

        // Tắt hiệu ứng typing
        setIsTyping(false);

        if (dataDetail.title === 'Chat') {
          try {
            const promptName = `This is a new chat, and user ask about ${currentMessage}. No rely and comment just give me a name for this chat, Max length is 10 characters`;
            const newTitle = await Gemini(promptName);
            dispatch(setNameChat({ newTitle, chatId: id }));
          } catch (titleError) {
            console.error("Error setting chat title:", titleError);
          }
        }

        if (chatText) {
          // Format response before adding it to redux store
          const formattedResponse = formatResponse(chatText);
          
          // Dispatch to Redux store
          dispatch(addBotMessage({
            idChat: id,
            botMess: formattedResponse
          }));

          // Also update local state immediately to ensure UI updates
          setMessageDetail(prevMessages => [
            ...prevMessages,
            {
              id: uuidv4(),
              text: formattedResponse,
              isBot: true
            }
          ]);
        }
      } catch (error) {
        console.error("Error in chat handling:", error);
        setIsTyping(false);
      }

      setIsLoading(false);
    } else {
      // Tạo chat mới khi ở trang info hoặc không có id
      const newChatId = uuidv4();

      // Thêm chat mới vào Redux store
      dispatch(addChat(newChatId));

      // Đợi một chút để đảm bảo chat đã được tạo trong Redux
      await new Promise(resolve => setTimeout(resolve, 200));

      // Thêm tin nhắn người dùng vào Redux store
      dispatch(addUserMessage({
        idChat: newChatId,
        userMess: currentMessage
      }));

      // Chuyển hướng đến chat mới
      navigate(`/chat/${newChatId}`);

      // Cập nhật state cục bộ
      setDataDetail({
        id: newChatId,
        title: 'Chat',
        messages: [{
          id: uuidv4(),
          text: currentMessage,
          isBot: false
        }]
      });

      // Khởi tạo danh sách tin nhắn cục bộ
      setMessageDetail([{
        id: uuidv4(),
        text: currentMessage,
        isBot: false
      }]);

      // Hiển thị trạng thái loading
      setIsLoading(true);

      try {
        // Gọi API để lấy phản hồi
        const chatText = await Gemini(currentMessage, []);

        if (chatText) {
          // Format response before adding it to redux store
          const formattedResponse = formatResponse(chatText);
          
          // Thêm tin nhắn bot vào Redux store
          dispatch(addBotMessage({
            idChat: newChatId,
            botMess: formattedResponse
          }));

          // Cập nhật state cục bộ
          setMessageDetail(prevMessages => [
            ...prevMessages,
            {
              id: uuidv4(),
              text: formattedResponse,
              isBot: true
            }
          ]);

          // Đặt tên cho chat mới
          try {
            const promptName = `This is a new chat, and user ask about ${currentMessage}. No rely and comment just give me a name for this chat, Max length is 10 characters`;
            const newTitle = await Gemini(promptName);
            dispatch(setNameChat({ newTitle, chatId: newChatId }));
          } catch (titleError) {
            console.error("Error setting chat title:", titleError);
          }
        }
      } catch (error) {
        console.error("Error in new chat handling:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatDetail();
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleLike = (id) => {
    setLikedMessages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSuggestedPrompt = (prompt) => {
    setInputChat(prompt);
  };

  const toggleMessageExpansion = (id) => {
    setExpandedMessages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  const onFileSelected = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      // Xử lý file được chọn ở đây - có thể tạo một message mới với file này
      const file = files[0];
      setInputChat(prev => prev + ` [File đính kèm: ${file.name}]`);
    }
  };

  const regenerateResponse = (messageId) => {
    // Tìm message cần tái tạo
    const msgIndex = messageDetail.findIndex(msg => msg.id === messageId);
    if (msgIndex > 0) {
      // Lấy tin nhắn người dùng gần nhất trước đó
      const userMessage = messageDetail[msgIndex - 1];
      if (userMessage && !userMessage.isBot) {
        setInputChat(userMessage.text);
        // Có thể thực hiện gửi lại luôn nếu muốn
        // handleChatDetail();
      }
    }
  };

  const rateMessage = (id, isPositive) => {
    // Logic để đánh giá tin nhắn (có thể lưu vào state hoặc gửi lên server)
    console.log(`Message ${id} rated ${isPositive ? 'positive' : 'negative'}`);
  };

  // Chức năng tải xuống cuộc trò chuyện
  const handleDownloadChat = () => {
    if (messageDetail && messageDetail.length > 0) {
      // Chuẩn bị nội dung để xuất ra
      let content = `# ${dataDetail.title?.replace(/<[^>]*>/g, '') || 'Chat'}\n\n`;

      messageDetail.forEach(message => {
        const sender = message.isBot ? "🤖 Bot" : "👤 You";
        // Loại bỏ HTML tags từ tin nhắn bot
        const cleanText = message.isBot ? message.text.replace(/<[^>]*>/g, '') : message.text;
        content += `## ${sender}\n${cleanText}\n\n`;
      });

      // Tạo file và tải xuống
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const fileName = `chat-${dataDetail.title?.replace(/<[^>]*>/g, '').replace(/\s+/g, '-').toLowerCase() || 'export'}-${new Date().toISOString().slice(0, 10)}.md`;
      saveAs(blob, fileName);
    }
  };

  // Chức năng chia sẻ cuộc trò chuyện
  const handleShareChat = () => {
    // Tạo URL để chia sẻ
    const shareUrl = window.location.href;

    // Kiểm tra API Clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert("Đã sao chép đường dẫn chia sẻ vào clipboard!");
        })
        .catch(err => {
          console.error('Không thể sao chép: ', err);
          // Phương án dự phòng
          prompt("Sao chép đường dẫn này để chia sẻ:", shareUrl);
        });
    } else {
      // Hỗ trợ trình duyệt cũ
      prompt("Sao chép đường dẫn này để chia sẻ:", shareUrl);
    }
  };

  // Chức năng xóa cuộc trò chuyện 
  const handleDeleteChat = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) {
      dispatch(removeChat(id));
      navigate('/');
    }
  };

  // Thêm hàm xử lý thu âm giọng nói
  const toggleSpeechRecognition = () => {
    if (!isRecording) {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
  };

  const startSpeechRecognition = () => {
    setRecordingError(null);
    
    try {
      // Kiểm tra trình duyệt có hỗ trợ Speech Recognition không
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setRecordingError('Trình duyệt của bạn không hỗ trợ thu âm giọng nói');
        return;
      }
      
      recognitionRef.current = new SpeechRecognition();
      
      // Cấu hình
      recognitionRef.current.continuous = false; // chỉ nhận diện một lần
      recognitionRef.current.interimResults = false; // chỉ trả về kết quả cuối cùng
      recognitionRef.current.lang = recognitionLang; // sử dụng ngôn ngữ đã chọn
      
      // Bắt sự kiện kết quả
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputChat(prevInput => prevInput + transcript);
        stopSpeechRecognition();
      };
      
      // Bắt sự kiện lỗi
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setRecordingError(`Lỗi thu âm: ${event.error}`);
        stopSpeechRecognition();
      };
      
      // Bắt sự kiện kết thúc
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
      
      // Bắt đầu thu âm
      recognitionRef.current.start();
      setIsRecording(true);
      
      // Tự động dừng thu âm sau 10 giây nếu không có kết quả
      const newTimeoutId = setTimeout(() => {
        if (isRecording && recognitionRef.current) {
          stopSpeechRecognition();
          setRecordingError('Không nhận diện được giọng nói. Vui lòng thử lại.');
        }
      }, 10000);
      
      setTimeoutId(newTimeoutId);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setRecordingError('Không thể bắt đầu thu âm giọng nói');
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      // Xóa timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  };

  // Clean up khi component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Thay đổi hàm speakText để thêm hỗ trợ fallback cho tiếng Việt
  const speakText = async (text, messageId = null) => {
    // Dừng phát âm hiện tại nếu có
    if (isSpeaking) {
      stopSpeaking();
      
      // Nếu đang đọc tin nhắn hiện tại, chỉ dừng lại
      if (speakingMessageId === messageId) {
        return;
      }
    }
    
    // Loại bỏ HTML tags và làm sạch văn bản
    let plainText = text.replace(/<[^>]*>/g, '');
    
    // Thêm dấu chấm nếu không có dấu câu cuối cùng (giúp tạo ngắt nghỉ)
    if (!/[.!?;,:)]$/.test(plainText.trim())) {
      plainText = plainText.trim() + '.';
    }
    
    // Đánh dấu là đang nói
    setIsSpeaking(true);
    if (messageId) {
      setSpeakingMessageId(messageId);
    }
    
    // Phát hiện ngôn ngữ
    const detectedLanguage = googleTextToSpeech.detectLanguage(plainText);
    console.log("Ngôn ngữ được phát hiện:", detectedLanguage);
    
    try {
      // TIẾNG VIỆT: Sử dụng phương pháp trực tiếp không cần proxy
      if (detectedLanguage === 'vi-VN') {
        console.log("Thử phương pháp trực tiếp để đọc tiếng Việt");
        const success = await playVietnameseTTS(plainText);
        if (success) {
          setTimeout(() => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
          }, 500);
          return;
        }
      }
      
      // TIẾNG VIỆT: Thử nhiều phương pháp theo thứ tự ưu tiên
      if (detectedLanguage === 'vi-VN') {
        // 1. Thử dùng mSpeak trước nếu có sẵn (thư viện dành riêng cho tiếng Việt)
        if (typeof window.mSpeak !== 'undefined' && useGoogleTTS) {
          console.log("Sử dụng mSpeak để đọc tiếng Việt");
          try {
            const success = await googleTextToSpeech.speakVietnameseWithMSpeak(plainText);
            if (success) {
              // Đặt timeout để đảm bảo trạng thái cập nhật sau khi đọc xong
              setTimeout(() => {
                setIsSpeaking(false);
                setSpeakingMessageId(null);
              }, 500);
              return;
            }
          } catch (mSpeakError) {
            console.error("Lỗi khi sử dụng mSpeak:", mSpeakError);
          }
        }
        
        // 2. Thử dùng Google TTS với proxy
        if (useGoogleTTS) {
          console.log("Sử dụng Google TTS để đọc tiếng Việt");
          try {
            const success = await googleTextToSpeech.speakWithGoogleTTS(plainText, detectedLanguage);
            if (success) {
              // Đặt timeout để đảm bảo trạng thái cập nhật sau khi đọc xong
              setTimeout(() => {
                setIsSpeaking(false);
                setSpeakingMessageId(null);
              }, 500);
              return;
            }
          } catch (googleError) {
            console.error("Lỗi khi sử dụng Google TTS:", googleError);
          }
        }
        
        // 3. Thử với audioData
        if (useGoogleTTS) {
          console.log("Thử dùng Audio Data để đọc tiếng Việt");
          try {
            const success = await googleTextToSpeech.speakWithAudioData(plainText, detectedLanguage);
            if (success) {
              setTimeout(() => {
                setIsSpeaking(false);
                setSpeakingMessageId(null);
              }, 500);
              return;
            }
          } catch (audioError) {
            console.error("Lỗi khi phát âm với Audio Data:", audioError);
          }
        }
        
        // 4. Nếu tất cả đều thất bại, thử với FPT.AI TTS API nếu được cấu hình
        // Hoặc API tiếng Việt khác có thể thêm ở đây
      }
      
      // Tiếp tục với các phương pháp thông thường cho các ngôn ngữ khác
      // Sử dụng trực tiếp googleTextToSpeech.speak để đọc với giọng Việt tốt nhất
      if (useGoogleTTS && detectedLanguage === 'vi-VN') {
        const success = await googleTextToSpeech.speak(plainText);
        if (success) {
          // Đặt timeout để đảm bảo trạng thái cập nhật sau khi đọc xong
          setTimeout(() => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
          }, 500);
          return;
        }
      }
      
      // Kiểm tra có thể dùng ResponsiveVoice không
      let responsiveVoiceAvailable = isResponsiveVoiceLoaded();
      if (!responsiveVoiceAvailable) {
        responsiveVoiceAvailable = await loadResponsiveVoice();
      }
      
      // Sử dụng ResponsiveVoice nếu đã tải thành công
      if (responsiveVoiceAvailable && isResponsiveVoiceLoaded()) {
        console.log("Sử dụng ResponsiveVoice để đọc văn bản");
        try {
          // Ánh xạ ngôn ngữ phát hiện được sang giọng ResponsiveVoice
          let voice = "Vietnamese Female"; // Mặc định tiếng Việt
          
          if (detectedLanguage.startsWith('en')) {
            voice = "US English Female";
          } else if (detectedLanguage.startsWith('zh')) {
            voice = "Chinese Female";
          } else if (detectedLanguage.startsWith('ja')) {
            voice = "Japanese Female";
          } else if (detectedLanguage.startsWith('ko')) {
            voice = "Korean Female";
          }
          
          // Kiểm tra xem giọng nói có sẵn không
          if (window.responsiveVoice && typeof window.responsiveVoice.getVoices === 'function') {
            const availableVoices = window.responsiveVoice.getVoices();
            const voiceExists = availableVoices.some(v => v.name === voice);
            
            if (!voiceExists) {
              console.warn(`Giọng nói "${voice}" không có sẵn, sử dụng giọng mặc định`);
              voice = window.responsiveVoice.getDefaultVoice().name;
            }
          }
          
          window.responsiveVoice.speak(plainText, voice, {
            pitch: 1,
            rate: 1,
            volume: 1,
            onend: () => {
              setIsSpeaking(false);
              setSpeakingMessageId(null);
            },
            onerror: (error) => {
              console.error("Lỗi khi phát âm với ResponsiveVoice:", error);
              setIsSpeaking(false);
              setSpeakingMessageId(null);
              // Không cần fallback ở đây vì đã xử lý lỗi
            }
          });
          
          return;
        } catch (rvError) {
          console.error("Lỗi khi sử dụng ResponsiveVoice:", rvError);
          // Tiếp tục với phương thức fallback
        }
      } else {
        console.log("ResponsiveVoice không khả dụng, sử dụng SpeechSynthesis API");
      }
      
      // Nếu ResponsiveVoice không khả dụng hoặc gặp lỗi, sử dụng SpeechSynthesis API
      if (window.speechSynthesis) {
        // Chia thành các câu để phát âm tốt hơn
        const sentences = plainText.split(/[.!?;]/).filter(s => s.trim().length > 0);
        let utterances = [];
        
        // Lấy danh sách giọng nói hiện có
        let voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          // Đợi giọng nói load xong nếu chưa sẵn sàng
          await new Promise(resolve => {
            const voicesChangedHandler = () => {
              voices = window.speechSynthesis.getVoices();
              window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
              resolve();
            };
            
            window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
            // Timeout để tránh treo nếu sự kiện không kích hoạt
            setTimeout(resolve, 1000);
          });
        }
        
        // Tìm giọng nói phù hợp với ngôn ngữ
        const languageCode = detectedLanguage.split('-')[0]; // Lấy phần đầu (vi, en, ja...)
        const matchingVoice = voices.find(voice => 
          voice.lang === detectedLanguage || 
          voice.lang.startsWith(languageCode + '-')
        );
        
        // Tạo đối tượng utterance cho mỗi câu
        sentences.forEach(sentence => {
          if (sentence.trim().length === 0) return;
          
          let processedSentence = sentence.trim();
          
          // Xử lý đặc biệt cho tiếng Việt nếu không có giọng tiếng Việt
          if (detectedLanguage === 'vi-VN' && (!matchingVoice || !matchingVoice.lang.startsWith('vi'))) {
            processedSentence = vietnameseSpeechHelper.optimizeForNonVietnameseVoice(processedSentence);
          }
          
          const utterance = new SpeechSynthesisUtterance(processedSentence);
          utterance.lang = detectedLanguage;
          
          if (matchingVoice) {
            utterance.voice = matchingVoice;
          }
          
          // Tối ưu hóa cho tiếng Việt
          if (detectedLanguage === 'vi-VN') {
            utterance.rate = 0.9; // Chậm hơn một chút cho tiếng Việt
            utterance.pitch = 1.0;
            // Áp dụng các điều chỉnh bổ sung nếu cần
            if (!matchingVoice || !matchingVoice.lang.startsWith('vi')) {
              vietnameseSpeechHelper.pronounceVietnamese(utterance, matchingVoice);
            }
          }
          
          utterances.push(utterance);
        });
        
        // Xử lý phát tuần tự các câu
        let currentIndex = 0;
        
        const speakNextSentence = () => {
          if (currentIndex < utterances.length) {
            const currentUtterance = utterances[currentIndex];
            currentIndex++;
            
            currentUtterance.onend = speakNextSentence;
            currentUtterance.onerror = (error) => {
              console.error("Lỗi khi phát âm câu:", error);
              speakNextSentence(); // Tiếp tục với câu tiếp theo
            };
            
            try {
              window.speechSynthesis.speak(currentUtterance);
            } catch (error) {
              console.error("Lỗi SpeechSynthesis:", error);
              speakNextSentence();
            }
          } else {
            // Hoàn thành tất cả các câu
            setIsSpeaking(false);
            setSpeakingMessageId(null);
          }
        };
        
        // Bắt đầu đọc câu đầu tiên
        speakNextSentence();
      } else {
        console.warn("SpeechSynthesis không khả dụng trên trình duyệt này");
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }
    } catch (error) {
      console.error("Lỗi khi phát âm:", error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  // Hàm dừng đọc
  const stopSpeaking = () => {
    // Dừng ResponsiveVoice nếu đang chạy
    if (isResponsiveVoiceLoaded() && window.responsiveVoice.isPlaying()) {
      window.responsiveVoice.cancel();
    }
    
    // Dừng SpeechSynthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

  // Hàm chuyển đổi chế độ tự động đọc
  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak);
  };

  // Hàm chọn giọng nói
  const handleVoiceChange = (voice) => {
    setSpeechVoice(voice);
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Thêm useEffect để tự động đọc tin nhắn mới từ bot khi autoSpeak được bật
  useEffect(() => {
    if (autoSpeak && messageDetail.length > 0) {
      const lastMessage = messageDetail[messageDetail.length - 1];
      if (lastMessage.isBot && !isLoading && !isTyping) {
        // Tự động đọc tin nhắn mới nhất từ bot
        speakText(lastMessage.text, lastMessage.id);
      }
    }
  }, [messageDetail, autoSpeak, isLoading, isTyping]);

  // Cập nhật hàm addBotMessage để tự động đọc khi có tin nhắn mới
  useEffect(() => {
    if (autoSpeak && !isLoading && !isTyping && messageDetail.length > 0) {
      // Khi bot vừa gửi tin nhắn mới
      const lastMessage = messageDetail[messageDetail.length - 1];
      if (lastMessage.isBot) {
        // Bắt đầu đọc sau 500ms để đảm bảo tin nhắn đã hiển thị
        const timer = setTimeout(() => {
          speakText(lastMessage.text, lastMessage.id);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [messageDetail, autoSpeak, isLoading, isTyping]);

  // Thêm nút để cài đặt giọng nói tạm thời (fake Vietnamese)
  const setupFakeVietnameseVoice = () => {
    // Tìm giọng nói tiếng Anh tốt nhất để làm cơ sở
    const googleEnVoice = availableVoices.find(voice => 
      voice.name.includes('Google') && (voice.lang === 'en-US' || voice.lang === 'en-GB')
    );
    const microsoftEnVoice = availableVoices.find(voice => 
      voice.name.includes('Microsoft') && (voice.lang === 'en-US' || voice.lang === 'en-GB')
    );
    const anyEnglishVoice = availableVoices.find(voice => voice.lang.startsWith('en'));
    
    // Chọn giọng tốt nhất hiện có
    const bestVoice = googleEnVoice || microsoftEnVoice || anyEnglishVoice || availableVoices[0];
    
    if (bestVoice) {
      setSpeechVoice(bestVoice);
      console.log("Đã thiết lập giọng giả lập tiếng Việt:", bestVoice.name);
      
      // Thông báo cho người dùng
      alert(`Đã thiết lập giọng ${bestVoice.name} để phát âm tiếng Việt tốt nhất có thể.`);
    }
  };

  // Thêm phương thức để trực tiếp sử dụng web Audio API không qua proxy 
  const playVietnameseTTS = async (text) => {
    try {
      // Sử dụng mSpeak nếu có sẵn
      if (typeof window.mSpeak !== 'undefined') {
        window.mSpeak.speak(text);
        return true;
      }
      
      // Fallback cho tiếng Việt không cần proxy
      const sentences = text.split(/[.!?;]/).filter(s => s.trim().length > 0);
      
      for (const sentence of sentences) {
        if (sentence.trim().length === 0) continue;
        
        // Tạo giọng nói tổng hợp đơn giản cho tiếng Việt
        const utterance = new SpeechSynthesisUtterance(sentence.trim());
        utterance.lang = 'vi-VN';
        
        // Điều chỉnh các tham số để tối ưu cho tiếng Việt
        utterance.rate = 0.8;  // Chậm hơn
        utterance.pitch = 1.0;
        
        // Chọn giọng nói tối ưu
        const voices = window.speechSynthesis.getVoices();
        
        // Ưu tiên chọn giọng nói tiếng Việt hoặc giọng Google/Microsoft
        const vietnameseVoice = voices.find(v => v.lang === 'vi-VN');
        const googleVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('vi'));
        const microsoftVoice = voices.find(v => v.name.includes('Microsoft') && v.lang.startsWith('vi'));
        
        const selectedVoice = vietnameseVoice || googleVoice || microsoftVoice;
        if (selectedVoice) utterance.voice = selectedVoice;
        
        // Phát âm
        window.speechSynthesis.speak(utterance);
        
        // Đợi đến khi phát âm xong
        await new Promise(resolve => {
          utterance.onend = resolve;
          // Thêm timeout để tránh bị treo
          setTimeout(resolve, sentence.length * 100);
        });
      }
      
      return true;
    } catch (error) {
      console.error("Lỗi khi phát âm tiếng Việt:", error);
      return false;
    }
  };

  return (
    <div className={`flex-1 h-screen flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className={`flex items-center justify-between px-5 py-3 ${isDarkMode
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700'
          : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
        } border-b shadow-md sticky top-0 z-40 transition-all duration-300`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMenuToggle(!menuToggle)}
            className="xl:hidden hover:opacity-80 transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <img src={IconMenu} alt="menu icon" className="w-6 h-6" />
          </button>

          {id && dataDetail && (
            <div className="flex items-center">
              <div className={`p-1.5 rounded-full mr-2 ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                }`}>
                <BiMessageDetail className="w-5 h-5 text-blue-500" />
              </div>
              <h1 className={`font-medium truncate text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                {typeof dataDetail.title === 'string'
                  ? dataDetail.title.replace(/<[^>]*>/g, '') || 'New Chat'
                  : 'New Chat'}
              </h1>
            </div>
          )}
        </div>

        {id && (
          <div className="flex items-center">
            <div className={`flex items-center rounded-full ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'} p-1`}>
              <button
                className={`p-2 rounded-full transition-all duration-200 ${isDarkMode
                    ? 'hover:bg-blue-500/20 text-gray-300 hover:text-blue-400'
                    : 'hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                  }`}
                title="Tải xuống cuộc trò chuyện"
                onClick={handleDownloadChat}
              >
                <FaFileDownload className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded-full transition-all duration-200 ${isDarkMode
                    ? 'hover:bg-blue-500/20 text-gray-300 hover:text-blue-400'
                    : 'hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                  }`}
                title="Chia sẻ"
                onClick={handleShareChat}
              >
                <RiShareLine className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded-full transition-all duration-200 ${isDarkMode
                    ? 'hover:bg-red-500/20 text-gray-300 hover:text-red-400'
                    : 'hover:bg-red-100 text-gray-600 hover:text-red-600'
                  }`}
                title="Xóa cuộc trò chuyện"
                onClick={handleDeleteChat}
              >
                <RiDeleteBin6Line className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {menuToggle && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMenuToggle(false)}
          />
          <div
            ref={sidebarRef}
            className="relative w-[280px] h-full"
          >
            <SideBar onToggle={() => setMenuToggle(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden max-w-[900px] w-full mx-auto py-4 px-4">
        {id ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
              {Array.isArray(messageDetail) && messageDetail.length > 0 ? (
                <>
                  {messageDetail.map((item) => (
                    <div key={item.id} className="animate-fadeIn">
                      <div
                        className={`flex space-x-4 ${item.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
                        onMouseEnter={() => setSelectedMessage(item.id)}
                        onMouseLeave={() => setSelectedMessage(null)}
                      >
                        <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden ${isDarkMode
                            ? item.isBot ? 'bg-blue-600' : 'bg-green-600'
                            : item.isBot ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-green-500 to-teal-500'
                          }`}>
                          {item.isBot ?
                            <img
                              src={ROBOT_IMG_URL}
                              alt="AI Bot"
                              className="w-full h-full object-cover"
                            /> :
                            <img
                              src={UserAvatar}
                              alt="User"
                              className="w-full h-full object-cover"
                            />
                          }
                        </div>
                        <div className={`flex-1 rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden
                          ${isDarkMode
                            ? item.isBot
                              ? 'bg-gray-800 border-gray-700 hover:shadow-md hover:shadow-blue-500/5'
                              : 'bg-gray-700 border-gray-600 hover:shadow-md hover:shadow-green-500/5'
                            : item.isBot
                              ? 'bg-white border-gray-200 hover:shadow-md'
                              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 hover:shadow-md'
                          }`}
                        >
                          {item.isBot && selectedMessage === item.id && (
                            <div className={`absolute right-4 -mt-3 flex items-center space-x-1 ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-600'
                              } rounded-full shadow-md px-2 py-1 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'
                              }`}>
                              <button
                                onClick={() => regenerateResponse(item.id)}
                                className="p-1 hover:bg-gray-100 hover:text-blue-500 rounded-full"
                                title="Tạo lại câu trả lời"
                              >
                                <IoRefresh className="w-3.5 h-3.5" />
                              </button>
                              {!item.isBot && (
                                <button
                                  onClick={() => setInputChat(item.text)}
                                  className="p-1 hover:bg-gray-100 hover:text-blue-500 rounded-full"
                                  title="Chỉnh sửa tin nhắn"
                                >
                                  <FaEdit className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          <div className="p-4">
                            {item.isBot ? (
                              <div
                                className={`prose prose-lg max-w-none ${expandedMessages[item.id] ? '' : 'max-h-[400px] overflow-y-auto'
                                  }`}
                                dangerouslySetInnerHTML={{ __html: formatResponse(item.text) }}
                              />
                            ) : (
                              <p className="text-lg">{item.text}</p>
                            )}

                          </div>

                          {item.isBot && (
                            <div className={`flex items-center justify-between p-2 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'
                              }`}>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => speakText(item.text, item.id)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    isSpeaking && speakingMessageId === item.id
                                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                      : isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-200'
                                  }`}
                                  title={isSpeaking && speakingMessageId === item.id ? "Dừng đọc" : "Đọc tin nhắn"}
                                >
                                  {isSpeaking && speakingMessageId === item.id ? 
                                    <IoVolumeMute className="w-4 h-4" /> : 
                                    <IoVolumeHigh className="w-4 h-4" />
                                  }
                                </button>
                                <button
                                  onClick={() => rateMessage(item.id, true)}
                                  className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                      ? 'text-gray-400 hover:text-green-400 hover:bg-gray-700'
                                      : 'text-gray-500 hover:text-green-500 hover:bg-gray-200'
                                    }`}
                                  title="Phản hồi tốt"
                                >
                                  <FaRegThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => rateMessage(item.id, false)}
                                  className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                      : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'
                                    }`}
                                  title="Phản hồi không tốt"
                                >
                                  <FaRegThumbsDown className="w-4 h-4" />
                                </button>
                                {item.text.length > 400 && (
                                  <button
                                    onClick={() => toggleMessageExpansion(item.id)}
                                    className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                        ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                                        : 'text-gray-500 hover:text-blue-500 hover:bg-gray-200'
                                      }`}
                                    title={expandedMessages[item.id] ? "Thu gọn" : "Xem thêm"}
                                  >
                                    {expandedMessages[item.id] ? "Thu gọn" : "Xem thêm"}
                                  </button>
                                )}
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => toggleLike(item.id)}
                                  className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                      ? likedMessages[item.id] ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                      : likedMessages[item.id] ? 'text-red-500 bg-red-100' : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'
                                    }`}
                                  title="Yêu thích"
                                >
                                  {likedMessages[item.id] ? <RiHeartFill className="w-4 h-4" /> : <RiHeartLine className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(item.text.replace(/<[^>]*>/g, ''), item.id)}
                                  className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                      ? copiedId === item.id ? 'text-green-400 bg-green-500/10' : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                                      : copiedId === item.id ? 'text-green-500 bg-green-100' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-200'
                                    }`}
                                  title={copiedId === item.id ? "Đã sao chép" : "Sao chép nội dung"}
                                >
                                  {copiedId === item.id ? <FaCheck className="w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && !isLoading && (
                    <div className="flex space-x-4 animate-fadeIn">
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden ${isDarkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                        <img
                          src={ROBOT_IMG_URL}
                          alt="AI Bot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`flex-1 p-4 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex space-x-4 animate-fadeIn">
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden ${isDarkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                        <img
                          src={ROBOT_IMG_URL}
                          alt="AI Bot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`flex-1 p-4 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <div className="flex items-center space-x-3">
                          <AiOutlineLoading3Quarters className="w-5 h-5 text-blue-500 animate-spin" />
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Đang xử lý câu trả lời...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-6 py-10">
                  <div className={`p-6 rounded-full ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
                    <BiMessageDetail className="w-16 h-16 text-blue-500" />
                  </div>
                  <div className="text-center space-y-2 max-w-md">
                    <p className="text-xl font-medium">Bắt đầu cuộc trò chuyện của bạn</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Hãy đặt câu hỏi hoặc chia sẻ những gì bạn đang suy nghĩ. Gemini AI sẽ tạo ra câu trả lời cho bạn.
                    </p>
                  </div>

                  <div className="w-full max-w-md flex flex-wrap justify-center gap-2 mt-4">
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedPrompt(prompt)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${isDarkMode
                            ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300'
                            : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <div className="relative mb-1">
                <div className="flex items-center space-x-3">
                  {isRecording && (
                    <div className={`absolute z-10 inset-0 ${isDarkMode ? 'bg-red-900/10' : 'bg-red-50/30'} pointer-events-none rounded-xl`}>
                      <div className={`absolute top-0 left-0 right-0 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'} text-${isDarkMode ? 'white' : 'red-600'} text-xs text-center py-1 rounded-t-xl animate-pulse`}>
                        Đang thu âm... (nói và dừng lại để ghi nhận)
                      </div>
                    </div>
                  )}
                  <div className="relative flex-1">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'
                      }`}>
                      <BiMessageAltDetail className="w-5 h-5" />
                    </div>
                    <textarea
                      value={inputChat}
                      placeholder="Nhập tin nhắn của bạn..."
                      rows={1}
                      className={`w-full py-3 pl-12 pr-20 rounded-xl resize-none transition-all duration-200 ${isDarkMode
                          ? 'bg-gray-800 text-white border-gray-700 placeholder-gray-500 focus:border-blue-500'
                          : 'bg-white text-gray-800 border-gray-300 placeholder-gray-400 focus:border-blue-400'
                        } border focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400`}
                      onChange={(e) => setInputChat(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{
                        minHeight: '50px',
                        maxHeight: '120px',
                        height: 'auto'
                      }}
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
                      <button 
                        onClick={handleFileUpload}
                        className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                          }`}
                        title="Tải lên hình ảnh"
                      >
                        <IoImage className="w-5 h-5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={onFileSelected}
                        accept="image/*"
                        className="hidden" 
                      />
                      <div className="relative">
                        <div className="flex items-center">
                          <button 
                            onClick={toggleSpeechRecognition}
                            className={`p-1.5 rounded-full transition-colors ${
                              isRecording 
                                ? isDarkMode ? 'bg-red-500 text-white' : 'bg-red-500 text-white' 
                                : isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                            }`}
                            title={isRecording ? "Dừng thu âm" : "Thu âm giọng nói"}
                          >
                            <IoMic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                          </button>
                          <button 
                            onClick={() => setShowLangDropdown(prev => !prev)}
                            className={`ml-1 text-xs ${isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-500'}`}
                            title="Chọn ngôn ngữ thu âm"
                          >
                            {recognitionLang.split('-')[0]}▾
                          </button>
                        </div>
                        
                        {showLangDropdown && (
                          <div className={`absolute right-0 mt-1 py-1 w-40 rounded-md shadow-lg z-20 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                            <div className={`px-2 py-1 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Chọn ngôn ngữ:
                            </div>
                            {supportedLanguages.map(lang => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setRecognitionLang(lang.code);
                                  setShowLangDropdown(false);
                                }}
                                className={`block w-full text-left px-4 py-1 text-sm ${
                                  recognitionLang === lang.code 
                                    ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800' 
                                    : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {lang.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`p-3 rounded-xl transition-all duration-300 transform ${inputChat.trim()
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white shadow-md hover:shadow-blue-500/30'
                        : 'bg-gray-200 cursor-not-allowed text-gray-400'
                      }`}
                    onClick={handleChatDetail}
                    disabled={!inputChat.trim()}
                  >
                    <IoSend className={`w-5 h-5 ${inputChat.trim() ? 'transform rotate-0' : 'rotate-[-45deg]'
                      } transition-transform duration-300`} />
                  </button>
                </div>
                {recordingError && (
                  <div className="text-xs text-red-500 mt-1 px-2">
                    {recordingError}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Nhấn Enter để gửi, Shift+Enter để xuống dòng
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Được hỗ trợ bởi Gemini AI
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col space-y-6">
              <div className="text-center space-y-3 max-w-2xl mx-auto pt-4">
                <h2 className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-[36px] inline-block text-transparent bg-clip-text font-bold">
                  Xin Chào
                </h2>
                <p className={`text-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Hôm nay tôi có thể giúp gì cho bạn?</p>
                <p className={`max-w-lg mx-auto text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  Gemini AI có thể giúp bạn viết, lập kế hoạch, học tập, và nhiều hơn nữa. Hãy bắt đầu bằng một câu hỏi hoặc từ các gợi ý dưới đây.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  {
                    title: "Lên kế hoạch bữa ăn",
                    desc: "Tạo thực đơn phù hợp cho gia đình hoặc sự kiện của bạn",
                    icon: "🍽️",
                    prompt: "Gợi ý thực đơn cho bữa tiệc 5 người với các món Việt Nam"
                  },
                  {
                    title: "Học ngôn ngữ mới",
                    desc: "Khám phá từ vựng và ngữ pháp của nhiều ngôn ngữ",
                    icon: "📚",
                    prompt: "Liệt kê 10 từ vựng tiếng Anh thông dụng về công nghệ"
                  },
                  {
                    title: "Viết thư xin việc",
                    desc: "Tạo email và thư xin việc chuyên nghiệp",
                    icon: "✉️",
                    prompt: "Viết một email xin việc cho vị trí lập trình viên web"
                  },
                  {
                    title: "Giải thích khái niệm",
                    desc: "Hiểu rõ các khái niệm phức tạp một cách đơn giản",
                    icon: "🧠",
                    prompt: "Giải thích khái niệm trí tuệ nhân tạo cho trẻ 10 tuổi"
                  },
                  {
                    title: "Lập kế hoạch du lịch",
                    desc: "Tạo lịch trình cho chuyến đi của bạn",
                    icon: "✈️",
                    prompt: "Lên kế hoạch du lịch Đà Nẵng 3 ngày 2 đêm"
                  },
                  {
                    title: "Luyện tập lập trình",
                    desc: "Học code và nhận gợi ý về các bài tập",
                    icon: "💻",
                    prompt: "Viết một hàm JavaScript để kiểm tra số nguyên tố"
                  },
                  {
                    title: "Tìm hiểu sức khỏe",
                    desc: "Thông tin về dinh dưỡng và tập luyện",
                    icon: "💪",
                    prompt: "Gợi ý các bài tập thể dục tại nhà không cần dụng cụ"
                  },
                  {
                    title: "Hỏi đáp công nghệ",
                    desc: "Giải đáp thắc mắc về các sản phẩm và xu hướng",
                    icon: "🔍",
                    prompt: "So sánh ưu nhược điểm của React và Vue.js"
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl transition-all duration-300 transform hover:scale-102 cursor-pointer 
                      ${isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500/40 shadow-md'
                        : 'bg-white hover:shadow-lg border border-gray-200 hover:border-blue-300/70'
                      }
                      group relative overflow-hidden
                    `}
                    onClick={() => {
                      setInputChat(item.prompt);
                      if (!id) {
                        navigate('/chat/info');
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex flex-col space-y-3 relative z-10">
                      <div className="flex">
                        <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <p className={`font-medium ${isDarkMode
                            ? 'text-gray-100 group-hover:text-white'
                            : 'text-gray-800 group-hover:text-gray-900'
                          }`}>
                          {item.title}
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add new chat input field directly on the home screen */}
              <div className={`max-w-3xl mx-auto w-full mt-8 rounded-xl shadow-md p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                <div className="relative mb-1">
                  <div className="flex items-center space-x-3">
                    {isRecording && (
                      <div className={`absolute z-10 inset-0 ${isDarkMode ? 'bg-red-900/10' : 'bg-red-50/30'} pointer-events-none rounded-xl`}>
                        <div className={`absolute top-0 left-0 right-0 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'} text-${isDarkMode ? 'white' : 'red-600'} text-xs text-center py-1 rounded-t-xl animate-pulse`}>
                          Đang thu âm... (nói và dừng lại để ghi nhận)
                        </div>
                      </div>
                    )}
                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
                      <BiMessageAltDetail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="relative flex-1">
                      <textarea
                        value={inputChat}
                        placeholder="Hỏi tôi bất cứ điều gì..."
                        rows={1}
                        className={`w-full py-3 px-4 rounded-xl resize-none transition-all duration-200 ${isDarkMode
                            ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:border-blue-500'
                            : 'bg-gray-50 text-gray-800 border-gray-200 placeholder-gray-500 focus:border-blue-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400`}
                        onChange={(e) => setInputChat(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                          minHeight: '50px',
                          maxHeight: '120px',
                          height: 'auto'
                        }}
                        onInput={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
                        <button 
                          onClick={handleFileUpload}
                          className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                            }`}
                          title="Tải lên hình ảnh"
                        >
                          <IoImage className="w-5 h-5" />
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={onFileSelected}
                          accept="image/*"
                          className="hidden" 
                        />
                        <div className="relative">
                          <div className="flex items-center">
                            <button 
                              onClick={toggleSpeechRecognition}
                              className={`p-1.5 rounded-full transition-colors ${
                                isRecording 
                                  ? isDarkMode ? 'bg-red-500 text-white' : 'bg-red-500 text-white' 
                                  : isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                              }`}
                              title={isRecording ? "Dừng thu âm" : "Thu âm giọng nói"}
                            >
                              <IoMic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                            </button>
                            <button 
                              onClick={() => setShowLangDropdown(prev => !prev)}
                              className={`ml-1 text-xs ${isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-500'}`}
                              title="Chọn ngôn ngữ thu âm"
                            >
                              {recognitionLang.split('-')[0]}▾
                            </button>
                          </div>
                          
                          {showLangDropdown && (
                            <div className={`absolute right-0 mt-1 py-1 w-40 rounded-md shadow-lg z-20 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                              <div className={`px-2 py-1 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Chọn ngôn ngữ:
                              </div>
                              {supportedLanguages.map(lang => (
                                <button
                                  key={lang.code}
                                  onClick={() => {
                                    setRecognitionLang(lang.code);
                                    setShowLangDropdown(false);
                                  }}
                                  className={`block w-full text-left px-4 py-1 text-sm ${
                                    recognitionLang === lang.code 
                                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800' 
                                      : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {lang.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`p-3 rounded-xl transition-all duration-300 transform ${inputChat.trim()
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white shadow-md hover:shadow-blue-500/30'
                          : isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                        } ${!inputChat.trim() && 'cursor-not-allowed'}`}
                      onClick={handleChatDetail}
                      disabled={!inputChat.trim()}
                    >
                      <IoSend className={`w-5 h-5 ${inputChat.trim() ? 'transform rotate-0' : 'rotate-[-45deg]'
                        } transition-transform duration-300`} />
                    </button>
                  </div>
                </div>
                {recordingError && (
                  <div className="text-xs text-red-500 mt-1 px-2">
                    {recordingError}
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Nhấn Enter để gửi, Shift+Enter để xuống dòng
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Được hỗ trợ bởi Gemini AI
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showVoiceSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className={`relative max-w-md w-full p-6 rounded-xl shadow-xl ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`}>
            <h3 className="text-xl font-bold mb-4">Cài đặt giọng nói</h3>
            
            <div className="mb-4">
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Ứng dụng sẽ tự động nhận diện ngôn ngữ và sử dụng giọng nói phù hợp với ngôn ngữ của tin nhắn.
              </p>
              
              <label className="flex items-center space-x-2 mb-4">
                <input 
                  type="checkbox" 
                  checked={autoSpeak} 
                  onChange={toggleAutoSpeak}
                  className="w-4 h-4 rounded accent-blue-500" 
                />
                <span className="text-sm">Tự động đọc tin nhắn mới từ bot</span>
              </label>
              
              <label className="flex items-center space-x-2 mb-4">
                <input 
                  type="checkbox" 
                  checked={useGoogleTTS} 
                  onChange={() => setUseGoogleTTS(!useGoogleTTS)}
                  className="w-4 h-4 rounded accent-blue-500" 
                />
                <span className="text-sm">Ưu tiên sử dụng phương pháp đặc biệt cho tiếng Việt (tốt hơn)</span>
              </label>
              
              <div className="mb-4">
                <label className="block text-sm mb-2">CORS Proxy URL (để truy cập Google TTS):</label>
                <select 
                  className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                  value={corsProxyUrl}
                  onChange={(e) => setCorsProxyUrl(e.target.value)}
                >
                  <option value="https://cors-anywhere.herokuapp.com/">CORS Anywhere</option>
                  <option value="https://api.allorigins.win/raw?url=">AllOrigins</option>
                  <option value="https://corsproxy.io/?">CORSProxy.io</option>
                  <option value="https://cors-proxy.htmldriven.com/?url=">HTMLDriven CORS Proxy</option>
                </select>
                <p className="text-xs mt-1 text-gray-500">Lưu ý: CORS Anywhere yêu cầu kích hoạt trước khi sử dụng. Nếu gặp lỗi 403, hãy thử các proxy khác.</p>
              </div>
              
              <div className={`mt-4 p-3 rounded-md ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} 
                ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                <h4 className="text-sm font-medium mb-1">Trạng thái hệ thống giọng nói</h4>
                <p className="text-xs mb-2">
                  {isResponsiveVoiceLoaded() 
                    ? "✅ ResponsiveVoice đã sẵn sàng với hỗ trợ tiếng Việt" 
                    : "⚠️ ResponsiveVoice chưa được tải, đang sử dụng giọng nói mặc định của trình duyệt"}
                </p>
                <p className="text-xs mb-2">
                  {typeof window.mSpeak !== 'undefined' 
                    ? "✅ Thư viện mSpeak cho tiếng Việt đã được tải" 
                    : "⚠️ Thư viện mSpeak chưa được tải, đang sử dụng phương pháp thay thế"}
                </p>
                <p className="text-xs">
                  {window.speechSynthesis ? "✅ Hệ thống SpeechSynthesis của trình duyệt hoạt động tốt" : "⚠️ Trình duyệt không hỗ trợ SpeechSynthesis"}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <button
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
                onClick={async () => {
                  if (!isResponsiveVoiceLoaded()) {
                    const result = await loadResponsiveVoice();
                    if (!result) {
                      alert("Không thể tải ResponsiveVoice. Hệ thống sẽ sử dụng giọng nói mặc định của trình duyệt.");
                    }
                  }
                  
                  // Tự động tải thư viện mSpeak cho tiếng Việt 
                  try {
                    if (typeof window.mSpeak === 'undefined') {
                      const script = document.createElement('script');
                      script.src = 'https://cdn.jsdelivr.net/gh/minhhungit/mspeak@master/dist/mspeak.min.js';
                      script.async = true;
                      document.head.appendChild(script);
                      alert("Đang tải thư viện phát âm tiếng Việt...");
                    }
                  } catch (e) {
                    console.error("Lỗi khi tải mSpeak:", e);
                  }
                }}
              >
                Tải lại giọng nói
              </button>
              
              <div className="flex space-x-3">
                <button
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  onClick={() => setShowVoiceSettings(false)}
                >
                  Đóng
                </button>
                
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => {
                    // Thử tiếng Việt
                    speakText("Xin chào, đây là tiếng Việt. Chúng tôi đã cải thiện chất lượng giọng nói. Cảm ơn bạn đã sử dụng tính năng này.");
                  }}
                >
                  Thử giọng nói
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDetail;

import React, { useState, useCallback, useEffect } from 'react';
import { Tab, PosturePrompt } from './types';
import { generateImage, getPosturePrompts, editImage } from './services/geminiService';
import { ImageIcon, SparklesIcon, ClipboardIcon, CheckIcon, PencilIcon, UploadIcon } from './components/icons';

const Spinner: React.FC = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
);

const Header: React.FC = () => (
  <header className="py-6 text-center">
    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
      AI Image & Prompt Studio
    </h1>
    <p className="text-gray-400 mt-2">Generate images with Imagen and discover prompts for Nano Banana</p>
  </header>
);

interface TabButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-t-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${
      isActive
        ? 'bg-gray-800 text-white border-b-2 border-purple-400'
        : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const PosturePromptCard: React.FC<{ prompt: PosturePrompt, onUsePrompt: (prompt: string) => void }> = ({ prompt, onUsePrompt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-purple-400 transition-all duration-300 ease-in-out transform hover:scale-105 flex flex-col">
      <h3 className="text-xl font-bold text-purple-300 mb-2">{prompt.title}</h3>
      <p className="text-gray-300 flex-grow">{prompt.prompt}</p>
      <div className="flex items-center gap-2 mt-4 self-start flex-wrap">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-50"
          disabled={copied}
        >
          {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Prompt'}
        </button>
        <button
            onClick={() => onUsePrompt(prompt.prompt)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
        >
            <PencilIcon className="w-4 h-4" />
            Use Prompt
        </button>
      </div>
    </div>
  );
};


export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERATE);

  // Generator state
  const [prompt, setPrompt] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageType, setUploadedImageType] = useState<string | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Prompts state
  const [posturePrompts, setPosturePrompts] = useState<PosturePrompt[]>([]);
  const [isPromptsLoading, setIsPromptsLoading] = useState<boolean>(true);
  const [promptsError, setPromptsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setIsPromptsLoading(true);
        setPromptsError(null);
        const prompts = await getPosturePrompts();
        setPosturePrompts(prompts);
      } catch (e: any) {
        setPromptsError(e.message || 'An unknown error occurred.');
      } finally {
        setIsPromptsLoading(false);
      }
    };
    fetchPrompts();
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const url = await generateImage(prompt);
      setImageUrl(url);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setUploadedImageType(file.type);
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImage(reader.result as string);
            setEditedImageUrl(null);
            setEditError(null);
        };
        reader.readAsDataURL(file);
    } else {
        setEditError("Please select a valid image file.");
    }
  };

  const handleEditImage = useCallback(async () => {
    if (!editPrompt.trim() || !uploadedImage || isEditing || !uploadedImageType) return;

    setIsEditing(true);
    setEditError(null);
    setEditedImageUrl(null);

    try {
        const base64Data = uploadedImage.split(',')[1];
        const url = await editImage(base64Data, uploadedImageType, editPrompt);
        setEditedImageUrl(url);
    } catch (e: any) {
        setEditError(e.message || 'An unknown error occurred.');
    } finally {
        setIsEditing(false);
    }
  }, [editPrompt, uploadedImage, uploadedImageType, isEditing]);

  const handleUsePrompt = (promptText: string) => {
    setActiveTab(Tab.EDIT);
    setEditPrompt(promptText);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="container mx-auto px-4 py-8">
        <Header />

        <div className="mt-8 flex justify-center border-b border-gray-700">
          <TabButton
            label="Image Generator"
            icon={<ImageIcon className="w-5 h-5" />}
            isActive={activeTab === Tab.GENERATE}
            onClick={() => setActiveTab(Tab.GENERATE)}
          />
          <TabButton
            label="Image Editor"
            icon={<PencilIcon className="w-5 h-5" />}
            isActive={activeTab === Tab.EDIT}
            onClick={() => setActiveTab(Tab.EDIT)}
          />
          <TabButton
            label="Posture Prompts"
            icon={<SparklesIcon className="w-5 h-5" />}
            isActive={activeTab === Tab.PROMPTS}
            onClick={() => setActiveTab(Tab.PROMPTS)}
          />
        </div>

        <div className="mt-8">
          {activeTab === Tab.GENERATE && (
            <div className="flex flex-col items-center gap-8">
              <div className="w-full max-w-2xl">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A photorealistic image of a majestic lion wearing a crown, cinematic lighting..."
                  className="w-full h-32 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleGenerateImage}
                  disabled={isLoading || !prompt.trim()}
                  className="w-full mt-4 py-3 px-6 flex items-center justify-center gap-2 font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {isLoading ? 'Generating...' : 'Generate Image'}
                  {!isLoading && <SparklesIcon className="w-5 h-5" />}
                </button>
              </div>

              <div className="w-full max-w-2xl h-96 flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl overflow-hidden">
                {isLoading && <Spinner />}
                {error && <div className="text-center p-4"><p className="text-red-400 font-semibold">Error</p><p className="text-gray-300">{error}</p></div>}
                {!isLoading && !error && imageUrl && <img src={imageUrl} alt="Generated" className="w-full h-full object-cover" />}
                {!isLoading && !error && !imageUrl && (
                  <div className="text-center text-gray-500">
                    <ImageIcon className="w-16 h-16 mx-auto" />
                    <p className="mt-2">Your generated image will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === Tab.EDIT && (
             <div className="flex flex-col items-center gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-semibold text-center text-gray-300">Original Image</h2>
                        <div className="w-full h-96 flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl overflow-hidden relative group">
                            {uploadedImage ? (
                                <img src={uploadedImage} alt="Uploaded for editing" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-500 p-4">
                                    <UploadIcon className="w-16 h-16 mx-auto" />
                                    <p className="mt-2">Click or drag image to upload</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={isEditing}
                                aria-label="Upload original image"
                            />
                             <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <p className="text-white text-lg font-semibold">Change Image</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-semibold text-center text-gray-300">Edited Image</h2>
                        <div className="w-full h-96 flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-xl overflow-hidden">
                            {isEditing && <Spinner />}
                            {editError && <div className="text-center p-4"><p className="text-red-400 font-semibold">Error</p><p className="text-gray-300">{editError}</p></div>}
                            {!isEditing && !editError && editedImageUrl && <img src={editedImageUrl} alt="Edited result" className="w-full h-full object-contain" />}
                            {!isEditing && !editError && !editedImageUrl && (
                                <div className="text-center text-gray-500 p-4">
                                    <PencilIcon className="w-16 h-16 mx-auto" />
                                    <p className="mt-2">Your edited image will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="w-full max-w-5xl">
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="e.g., Change the person's pose to be sitting cross-legged..."
                      className="w-full h-24 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      disabled={isEditing || !uploadedImage}
                      aria-label="Image editing prompt"
                    />
                    <button
                      onClick={handleEditImage}
                      disabled={isEditing || !editPrompt.trim() || !uploadedImage}
                      className="w-full mt-4 py-3 px-6 flex items-center justify-center gap-2 font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {isEditing ? 'Editing...' : 'Edit Image'}
                      {!isEditing && <SparklesIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
          )}

          {activeTab === Tab.PROMPTS && (
            <div>
              <h2 className="text-2xl font-bold text-center mb-6">Posture Editing Prompt Ideas</h2>
               {isPromptsLoading && <div className="flex justify-center"><Spinner /></div>}
               {promptsError && <div className="text-center p-4 text-red-400 bg-red-900/20 rounded-lg">{promptsError}</div>}
               {!isPromptsLoading && !promptsError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posturePrompts.map((p, index) => (
                    <PosturePromptCard key={index} prompt={p} onUsePrompt={handleUsePrompt} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
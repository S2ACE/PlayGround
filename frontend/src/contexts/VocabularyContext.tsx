import { createContext, useContext, useState, useEffect, type ReactNode, type JSX } from 'react';
import { getAllVocabulary, type Vocabulary } from '../api/vocabularyApi';
import { getRandomWord } from '../utils';

type VocabularyContextType = {
    vocabList: Vocabulary[];
    loading: boolean;
    getNewWord: () => string;
    isReady: boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export const useVocabulary = () => {
    const context = useContext(VocabularyContext);
    if (!context) {
        throw new Error('useVocabulary must be used within VocabularyProvider');
    }
    return context;
};

interface VocabularyProviderProps {
    children: ReactNode;
}

export const VocabularyProvider = ({ children }: VocabularyProviderProps): JSX.Element => {
    const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function fetchVocabulary() {
            try {
                setLoading(true);
                const list = await getAllVocabulary('en');
                
                if (mounted) {
                    setVocabList(list);
                    setTimeout(() => {
                        if (mounted) {
                            setInitialLoadComplete(true);
                        }
                    }, 100);
                }
            } catch (error) {
                console.error("Fetch vocabulary failed:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }
        
        fetchVocabulary();

        return () => {
            mounted = false;
        };
    }, []);

    const getNewWord = () => {
        if (vocabList.length > 0) {
            return getRandomWord(vocabList);
        }
        return '';
    };

    const value = {
        vocabList,
        loading,
        getNewWord,
        isReady: !loading && vocabList.length > 0 && initialLoadComplete
    };

    return (
        <VocabularyContext.Provider value={value}>
            {children}
        </VocabularyContext.Provider>
    );
};
export default VocabularyContext;
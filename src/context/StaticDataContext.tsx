import React, { createContext, useContext } from 'react';

interface StaticDataContextType {
    content?: string;
}

const StaticDataContext = createContext<StaticDataContextType>({});

export const useStaticData = () => useContext(StaticDataContext);

export const StaticDataProvider: React.FC<{ value: StaticDataContextType; children: React.ReactNode }> = ({ value, children }) => {
    return (
        <StaticDataContext.Provider value={value}>
            {children}
        </StaticDataContext.Provider>
    );
};

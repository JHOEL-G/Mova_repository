import { createContext, useContext, useState, useEffect } from 'react';

const FlowContext = createContext();

export const useFlow = () => useContext(FlowContext);

export const FlowProvider = ({ children }) => {
    const [completedSteps, setCompletedSteps] = useState(() => {
        const saved = sessionStorage.getItem('completedSteps');
        return saved ? JSON.parse(saved) : {};
    });

    const [validIds, setValidIds] = useState(() => {
        const saved = sessionStorage.getItem('validIds');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        sessionStorage.setItem('completedSteps', JSON.stringify(completedSteps));
        console.log("📦 completedSteps actualizado:", completedSteps);
    }, [completedSteps]);

    useEffect(() => {
        sessionStorage.setItem('validIds', JSON.stringify(validIds));
        console.log("📦 validIds actualizado:", validIds);
    }, [validIds]);

    const invalidateId = (userId) => {
        setCompletedSteps(prev => {
            const newSteps = { ...prev };
            delete newSteps[userId];
            return newSteps;
        });
        setValidIds(prev => prev.filter(id => id !== userId));
    };

    const isValidId = (userId) => {
        if (!userId) return false;

        const isValid = validIds.includes(userId) ||
            !!completedSteps[userId] ||
            userId === "v-test";

        console.log("🔍 isValidId check:", { userId, isValid });
        return isValid;
    };

    const markStepComplete = (userId, step) => {
        console.log("✅ markStepComplete llamado:", { userId, step });

        setValidIds(prev => {
            if (!prev.includes(userId)) {
                return [...prev, userId];
            }
            return prev;
        });

        setCompletedSteps(prev => ({
            ...prev,
            [userId]: { ...(prev[userId] || {}), [step]: true }
        }));
    };

    const canAccessStep = (userId, step) => {
        const stepOrder = [
            'detalleVale',
            'formulario',
            'capturaINE',
            'reconocimiento',
            'vista'
        ];

        const stepIndex = stepOrder.indexOf(step);

        if (stepIndex <= 0) {
            console.log(`✅ Paso "${step}" es el primero, siempre accesible`);
            return true;
        }

        const esSoloLeyenda = userId?.startsWith("2") ||
            userId?.startsWith("3") ||
            userId?.startsWith("4");

        if (esSoloLeyenda && step === 'capturaINE') {
            const canAccess = !!completedSteps[userId]?.['detalleVale'];
            console.log(`✅ Flujo leyenda - capturaINE accesible:`, canAccess);
            return canAccess;
        }

        const previousStep = stepOrder[stepIndex - 1];
        const canAccess = !!completedSteps[userId]?.[previousStep];

        console.log("🔍 canAccessStep check:", {
            userId,
            step,
            previousStep,
            canAccess,
            completedSteps: completedSteps[userId]
        });

        return canAccess;
    };

    return (
        <FlowContext.Provider value={{
            markStepComplete,
            canAccessStep,
            isValidId,
            invalidateId
        }}>
            {children}
        </FlowContext.Provider>
    );
};
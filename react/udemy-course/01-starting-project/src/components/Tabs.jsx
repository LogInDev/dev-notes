export default function Tabs({ children, buttons, ButtonContainer = 'menu' }) {
    // const ButtonContainer = buttonContainer;
    return (
        <>
            <ButtonContainer>{buttons}</ButtonContainer>
            {children}
        </>
    );
}
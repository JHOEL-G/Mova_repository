import Cards from "react-credit-cards-2";
import "react-credit-cards-2/dist/es/styles-compiled.css";

const TarjetaCredito = () => {
    return (
        <Cards
            cvc="123"
            name="John Doe"
            number="2345678901234567"
            expiry="1224"
        />
    );
};

export default TarjetaCredito;

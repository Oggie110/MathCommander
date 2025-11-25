import { BrowserRouter } from "react-router-dom";

const App = () => (
    <BrowserRouter>
        <div style={{ padding: '2rem', fontFamily: 'Arial', color: 'white', backgroundColor: '#000' }}>
            <h1>Space Math Commander</h1>
            <p>Test - if you can see this, React is working!</p>
        </div>
    </BrowserRouter>
);

export default App;

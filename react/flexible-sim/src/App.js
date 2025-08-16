import React, { Component } from 'react';
import { Provider } from 'react-redux';
import store from './store';                      // ★ default import
import AISearch from './components/ai_search/header/AISearch';
import LeftSide from './components/ai_search/left/LeftSide';
import RightSide from './components/ai_search/right/RightSide';

class App extends Component {
    render(){
        return (
            <Provider store={store}>
                <div className="app">
                    <header className="header">
                        <div className="left"/>
                        <div className="right"><AISearch/></div>
                        <div className="left"/>
                    </header>
                    <main className="main">
                        <div className="main-wrap">
                            <LeftSide/>
                            <RightSide/>
                        </div>
                    </main>
                </div>
            </Provider>
        );
    }
}
export default App;

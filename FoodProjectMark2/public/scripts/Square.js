class Square extends React.Component {
  constructor(props){
      super(props);

      this.state = {
          food: props.food,
          foodid: props.foodid,
          available:false,
      }
  }

  toggleActivation() {
    // Gets itself
    const doc = document.querySelector(".food"+this.state.foodid); // gets this own components class

    let prevActive = doc.getAttribute('class').includes("redsquare"); // Allows outside modifications to the DOM to affect the component
    if (!prevActive) {
        let words = JSON.parse(window.sessionStorage.getItem("words")) || [];
        words.push(this.state.foodid);
        window.sessionStorage.setItem("words", JSON.stringify(words));
    } else {
        let words = JSON.parse(window.sessionStorage.getItem("words")) || [];
        if (words) {
            words.splice(words.indexOf(this.state.foodid),1);
            window.sessionStorage.setItem("words", JSON.stringify(words));
        }
    }
    this.setState({ available: !prevActive }); // doesn't seem to apply until some time after the if
  };

  render(){
      return(
          <>
            <div className={[this.state.available?"redsquare scheduleButton food"+(this.state.foodid)
            :"square scheduleButton food"+(this.state.foodid)
            ]} onClick={(this.toggleActivation.bind(this))} >
                {this.state.food}
            </div>
          </>
      )
  }
}

/*
class Square extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        name: 'G',
        appVersion: ''
    }
}

render() {
    return(
        <><h2>Hello {this.state.name || 'Friend'}! Welcome Back.</h2>
        {
            this.state.appVersion && this.state.appVersion < 2
            ? <p>Your app is out of date.</p>
            : ''
        }
        <button>Download</button></>
    )
}
}
*/
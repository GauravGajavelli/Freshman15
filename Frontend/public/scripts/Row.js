class Row extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            contents: props.contents,
            time: props.time,
        }
    }

    render(){
        return(
            <>
            {
                <div className="row"  >
                {this.state.contents}
            </div>}
          </>
        )
    }


}
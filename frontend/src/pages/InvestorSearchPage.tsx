import React, { useEffect, useState } from 'react';
import firebase, { useFirebaseUser } from '@fire';
import countriesList from '../res/countries.json';
import UserCard from '@components/UserCard';
import User from '@interfaces/User';


function InvestorSearchPage() {
    const db = firebase.firestore(); // database
    const user = useFirebaseUser(); // custom hook to retrieve global user

    const [investors, setInvestors] = useState<firebase.firestore.DocumentData[]>([]); // list of investors to display
    const [search, setSearch] = useState(""); // search query

    const emptyCountry = {code: "", name: "", states: [{name: "", code: ""}]}; // empty case
    const [defaultCountry, setDefaultCountry] = useState(emptyCountry); // default value
    const [country, setCountry] = useState(defaultCountry); // country location

    const emptyTerritory = {code: "", name: ""}; // empty case
    const [defaultTerritory, setDefaultTerritory] = useState(emptyTerritory) // default value
    const [territory, setTerritory] = useState(defaultTerritory); // state/territory location


    // Helper function to find a territory within a country
    function countryContains(country, territory) {
        let result = null;
        if (country.states !== null) {
            country.states.forEach(st => {
                if (st.code === territory.code || st.name === territory.name) {
                    //console.log(st.code)
                    result = st;
                }
            });
        }
        return result;
    }

    // useEffect hook that sets the default value of location based on the user's profile
    useEffect(() => {
        if (user) { // set default country to user's location
            countriesList.countries.forEach(co => {
                if (co.code === user.country) {
                    if (co.states === null) {
                        let obj = {code: co.code, name: co.name, states: []}; // deal with weird type checks
                        setCountry(obj);
                        setDefaultCountry(obj);
                    }
                    else {
                        setCountry(co);
                        setDefaultCountry(co);
                        let terr = countryContains(co, {code: user.state, name: user.state})
                            if (terr !== null) {
                                setTerritory(terr);
                                setDefaultTerritory(terr);
                            }

                    }

                    return
                }
            })
        }
    }, [user])

    const tagOptions = ["tech", "knowledge", "business", "success"]; // tag options available
    const [tags, setTags] = useState<String[]>([]); // tags query

    // const [goalPercent, setGoalPercent] = useState(-1.0); // default set to negative 1 to avoid confusion, percent progress towards a goal
    // const goalPercentBreakpoints = [0.0, 0.25, 0.5, 0.75, 1.0]; // breakpoints for the filters

    // useEffect hook that runs when the component loads or when search, tags, or location fields are changed
    useEffect(() => {

        // Investors retrieval
        let arr: firebase.firestore.DocumentData[] = []; // temp array
        db.collection("users").limit(100).onSnapshot((snapshot) => { // retrieve the first 100 users stored in database
            snapshot.forEach((doc) => {
                if (doc.exists) {
                    let investor = doc.data();
                    let validated = true;

                    // Search query
                    validated = validated && (search === "" || search.toLowerCase().includes(investor.firstName.toLowerCase()) || investor.lastName.toLowerCase().includes(search.toLowerCase()));

                    // Search query in investor's tags
                    validated = validated || (search === "" || (investor.tags !== undefined && investor.tags.includes(search.toLowerCase())));

                    // Tag fields
                    tags.map(tag => {
                        validated = validated && (investor.tags !== undefined && investor.tags.includes(tag));
                        return validated;
                    });

                    // Country
                    validated = validated && (country.code === "" || country.code === investor.country);

                    // Territory
                    validated = validated && (territory.code === "" || territory.code === investor.state);

                    // Check that investor is an investor
                    validated = validated && (investor.investedStartups != undefined && investor.investedStartups.length !== 0);

                    // Check that the investor is not the signed in investor
                    validated = validated && (investor === null || (investor.email !== user?.email));

                    if (validated) { // add investor to list to display
                        arr.push(investor);
                    }
                }

            });
            setInvestors(arr);
            //console.log(arr);

        });

    }, [search, tags, country, territory]); // dependencies


    // Handles search query
    function handleSearch(e) {
        let query = "" + e.target.value;
        if (query.length > 0) {
            setSearch(query);
        }
        else {
            setSearch("");
        }
        //console.log(query);
    }

    // Handles selection of tags to include/declude from search
    function handleTags(e) {
        let tag = e.target.name;
        let arr = [...tags];
        if (!arr.includes(tag)) { // add tag to list of tags selected if not already there
            arr.push(tag);
        }
        else if (arr.indexOf(tag) > -1) { // remove tag from list of tags selected if it exists in the array
            arr.splice(arr.indexOf(tag), 1);
        }
        setTags(arr);
        //console.log(arr);
    }

    // Handles country selection
    function handleCountry(e) {
        let co = e.target.value;
        if (co === "-") {
            setCountry(emptyCountry);
            setTerritory(emptyTerritory); // reset the territory to avoid errors
        }
        else {
            setCountry(JSON.parse(co));
            let terr = countryContains(JSON.parse(co), defaultTerritory) // check if country contains default territory
            if (terr !== null) {
                setTerritory(terr);
            }
            else {
                setTerritory(emptyTerritory); // reset the territory to avoid errors
            }
        }

    }

    function handleTerritories(e) {
        let te = e.target.value;
        if (te === "-") {
            setTerritory(emptyTerritory);
        }
        else {
            setTerritory(JSON.parse(te));
            //console.log(JSON.parse(te));
        }

    }


    return (
        <div>
            <h1>Find your Next Investor</h1>
            <label>Search:
                <input onChange={handleSearch}></input>
            </label>
            <div>
                <h4>Tags:</h4>
                {tagOptions.map((tag) => {
                        return (
                        <div>
                            <label><input type="checkbox" id={tag} name={tag} onChange={handleTags}></input>{tag}</label>
                        </div>
                        )
                    })
                }

                <h4>Location: </h4>
                <label>Country:
                    <select onChange={handleCountry}>
                        <option value={JSON.stringify(defaultCountry)}>{defaultCountry.name}</option>
                        <option value={"-"}>{"-"}</option>
                        <hr></hr>
                        {countriesList.countries.map((country) => {
                            return (
                                <option value={JSON.stringify(country)}>{country.name}</option>
                            )
                        })
                        }
                    </select>
                </label>


                {country.states !== null && country.code !== "" ? <label>State/Territory:
                    <select onChange={handleTerritories}>
                        {country.states.map((territory, index) => {
                            let terr = countryContains(country, defaultTerritory);
                            if (index === 0 && terr !== null) { // if the default territory is in the list, place it at the top
                                return (
                                    <>
                                        <option value={JSON.stringify(defaultTerritory)}>{defaultTerritory.name}</option>
                                        <option value={"-"}>{"-"}</option>
                                        <hr></hr>
                                    </>
                                )
                            }
                            else if (index === 0) { // otherwise place the "-" option
                                return (
                                    <>
                                        <option value={"-"}>{"-"}</option>
                                        <hr></hr>
                                        {territory !== emptyTerritory ? <option value={JSON.stringify(territory)}>{territory.name}</option> : <></>}
                                    </>
                                )
                            }
                            else { // all other cases place the current territory in the list
                                return (
                                    <option value={JSON.stringify(territory)}>{territory.name}</option>
                                )
                            }
                        })}
                    </select>
                </label>
                : <></>
                }

            </div>

            <hr></hr>
            <div>
                <h2>Investors: </h2>
                {investors.map((investor) => {
                    return (
                        <div>
                            <UserCard user={investor as User}/>

                        </div>
                    )
                })}
            </div>

        </div>
    )
}

export default InvestorSearchPage

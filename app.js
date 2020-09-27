//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

// var items = [];
// var workItems = [];
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

//Connect to mongoDB database.
mongoose.connect('mongodb+srv://admin-pranoy:password1234@cluster0.lfgz2.mongodb.net/toDoListDB', {useNewUrlParser: true, useUnifiedTopology: true});

//Create new Schema
const itemSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

//Mongoose model
const Item = mongoose.model('Item', itemSchema);

const List = mongoose.model('List', listSchema);

//Insert default in the database
const item1 = new Item ({
  name: 'Buy protein'
});
const item2 = new Item ({
  name: 'Buy creatine'
});
const item3 = new Item ({
  name: 'Buy glutamine'
});

const defaultItems = [item1, item2, item3];


app.get("/", (req, res) => {

  // const today = new Date();
  //
  // var options = {
  //   weekday: 'long',
  //   day: 'numeric',
  //   month: 'long'
  // };
  //
  // var day = today.toLocaleDateString("en-US", options);

  //Finding all the element inside the collection
  Item.find((err, foundItems) => {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        err ? console.log(err) : console.log('Default items added to the DB');
      });
      res.redirect('/');
    }

    err ? console.log(err) :
    res.render('list',{
      listTitle: "Today",
      foundItems: foundItems
    });
  });
});

app.post("/", (req,res) => {

  const listName = req.body.list;
  const itemName = req.body.task;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
});

app.post("/delete", (req,res) => {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({_id: checkedItemID}, (err) => {
      err ? console.log(err) : console.log("Successfully Deleted the Item");
    });
    res.redirect('/');
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemID}}},
      (err, foundList) => {
        err ? console.log(err) : res.redirect(`/${listName}`);
    });
  }


});

app.get("/:customListName", (req,res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
    if(!err) {
      if (!foundList) {
        //Create a new List
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect(`/${customListName}`)
      } else {
        //Show an existing List
        res.render('list',{
          listTitle: foundList.name,
          foundItems: foundList.items
        });
      }
    }
  });


});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
  console.log("Server started Successfully");
});

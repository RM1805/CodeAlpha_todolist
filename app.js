const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch((err) => console.log(err));
async function main() {
  mongoose.set("strictQuery", false);
  await mongoose.connect("mongodb+srv://therishimishra:Rishi-123@cluster0.qj0tyeo.mongodb.net/todolistDB", {useNewUrlParser: true,});
  console.log("Connected to the database");
}
  const itemSchema = new mongoose.Schema({
    name: String
  });

  const Item = mongoose.model("Item", itemSchema);

  const item1 = new Item({
    name: "Welcome to the todolist"
  });
  const item2 = new Item({
    name: "Hit the + button to add new item"
  });
  const item3 = new Item({
    name: "<-- Hit this to delete an item"
  });

  const defaultItems = [item1,item2,item3];

  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
  });

  const List = mongoose.model("List", listSchema);

  

app.get("/", function(req, res){
  let today = new Date();
  let options = {
    weekday: "long",
    day: "numeric",
    month: "long"
  };
  let day = today.toLocaleDateString("en-UK", options);

  Item.find({}, function(err,foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else {
          console.log("sucessfully added default items to the DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });


});

app.get("/:customlistName", function(req,res){
  const customlistName = _.capitalize(req.params.customlistName);
  List.findOne({name: customlistName}, function(err,foundList){
    if(!err){
      if(!foundList){
        const list = new List({
        name: customlistName,
        items: defaultItems
        });
        list.save();

        res.redirect("/"+ customlistName);
      }else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req,res){
const newItem = req.body.newItem;
const listName = req.body.list;
const item = new Item({
  name: newItem
});

if(listName==="Today"){
  item.save();
  res.redirect("/");
} else {
  List.findOne({name: listName}, function(err,foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/"+ listName);
  });
}


});

app.post("/delete",function(req,res){
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
  if (listName==="Today"){
    Item.findByIdAndRemove(checkedItem, function(err){
      if (err){
        console.log(err);
      } else {
        res.redirect("/");
        console.log("Sucesssfully deleted the unwanted entry");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items:{_id:checkedItem}}}, function(err,foundList){
      if(!err){
        res.redirect("/"+ listName);
      }
    });
  }

});





app.listen(process.env.PORT, function(){
  console.log("server started on port 3000");
});

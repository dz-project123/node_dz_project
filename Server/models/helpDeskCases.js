/*
    helpdesk model
    const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
*/
const mongoose = require("mongoose");
const { Schema } = mongoose;

const helpDeskCaseSchema = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId , 
      ref: "Order",  
      required: true,
    },
    userId: { type: String},
    email: { type: String},
    subject: {
        type: String,
        required: true,
    },
    message: { type: String,
        required: true,
    },
    caseStatus: {type: String},
    resolveComments: {type: String}
    
    
  },
  { timestamps: true }
);

const helpDeskCase = mongoose.model("HelpDeskCase", helpDeskCaseSchema);

module.exports = { helpDeskCase };

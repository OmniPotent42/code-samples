'use strict';

const AlbumModel = require("./../models/Album");
const mongoose = require("mongoose");
const aws = require("aws-sdk");
const keys = require("./../config/keys");

const bucketName = "preschoolmusical";

aws.config.update({
    accessKeyId: keys.key,
    secretAccessKey: keys.secret,
    region: "us-west-2"
})

let s3 = new aws.S3();

module.exports = {
    readAll: (req, res, next) => {
        let query = {};
        if (req.query.tag) {
            query = {tags: req.query.tag};
        }
        AlbumModel.find(query, (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(result);
            }
        })
    },
    
    readOne: (req, res, next) => {
        AlbumModel.findById(req.params.id, (err, album) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(album);
            }
        })
    },
    
    create: (req, res, next) => {
        AlbumModel.create(req.body, (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(result);
            }
        })
    },
        
    delete: (req, res, next) => {
        AlbumModel.findByIdAndRemove(req.params.id, (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(result);
            }
        })
    },
    
    addPic: function(req, res, next) {
        AlbumModel.findById(req.params.id, (err, album) => {
            if (err) {
                res.status(500).send(err);
            } else {
                album.pics.push(req.body);
                album.save();
                res.send(album.pics[album.pics.length - 1]);
            }
        })
    },
    
    deletePic: function(req, res, next) {
        AlbumModel.findById(req.params.id, (err, album) => {
            if (err) {
                res.status(500).send(err);
            } else {
                //we are currently in the album, we need to find the picture object with the picId
                let pos = album.pics.map(function(x) {
                  console.log(x._id.toString());
                  return x._id.toString();
                })
                .indexOf(req.params.picId);
                
                // console.log('deleting picture ', pos);
                let deleted = album.pics.splice(pos, 1);
                album.save();
                res.send(deleted);
            }
        })
    },
    
    upload: (req, res, next) => {
        let buf = new Buffer(req.body.fileBody.replace(/^data:image\/\w+;base64,/,""), "base64");
        
        let params = {
            Bucket: bucketName,
            Key: req.body.fileName,
            Body: buf,
            ContentType: "image/" + req.body.fileName.substring(req.body.fileName.lastIndexOf(".")),
        }
        
        s3.upload(params, (err, data) => {
            if (err) {
                // console.error(err);
                return res.send(err);
            } else {
                // console.log("upload successful!");
                return res.send(data);
            }
        })
    },
    
    removeFromS3: (req, res, next) => {
        let params = {
            Bucket: bucketName,
            Key: req.body.key
        }
        
        s3.deleteObject(params, function(err, data) {
            if (err) {
                console.error(err);
                res.send(err);
            } else {
            }
            
            next();
        })
    },
    
    removeMultipleFromS3: (req, res, next) => {
        for (let i = 0; i < req.body.keys.length; i++) {
            let currentKey = req.body.keys[i];
            let params = {
                Bucket: bucketName,
                Key: currentKey
            };
            
            s3.deleteObject(params, (err, data) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(data);
                }
            })
        }
    }
    
}
import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = mongoose.Schema(
    {
        videoFile: {
            type: String
        },

        thumbnail: {
            type: String
        },

        title: {
            type: String
        },

        description: {
            type: String
        },
        duration: {
            type: Number
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

    }, {timestamps: true}
)

const Videos = mongoose.Schema("Videos", videoSchema);


videoSchema.plugin(mongooseAggregatePaginate)

export { Videos }
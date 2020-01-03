var firebaseConfig = {
    apiKey: "AIzaSyBKWikmtDevji69aJ82dWyFuUrRHVAguvI",
    authDomain: "neural-net-3da45.firebaseapp.com",
    databaseURL: "https://neural-net-3da45.firebaseio.com",
    projectId: "neural-net-3da45",
    storageBucket: "neural-net-3da45.appspot.com",
    messagingSenderId: "114093697431",
    appId: "1:114093697431:web:51fb1b15fac0e498ebbcd2",
    measurementId: "G-BSM3T5J3ZD"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

function array_dist(size){
    var temp = new Array(size);
    var sum = 0;
    for(var i = 0; i < size; i++){
        temp[i] = 4.5 + Math.random();
        sum += temp[i];
    }
    for(var i = 0; i < size; i++){
        temp[i] /= sum;
    }
    return temp;
}

class HMM {
    constructor(state_num, observed_num){
        this.state_num = state_num;
        this.observed_num = observed_num;
        this.start_prob = array_dist(state_num);
        this.state_prob = new Array(state_num);
        this.observed_prob = new Array(state_num);
        for(var i = 0; i < state_num; i++){
            this.state_prob = array_dist(state_num);
            this.observed_prob = array_dist(observed_num);
        }
        this.max_iters = 100;
    }
    
    forward_pass(alpha, scale, observations){
        scale[0] = 0;
        for(var i = 0; i < this.state_num; i++){
            alpha[0][i] = this.start_prob[i] * this.observed_prob[i][observations[i]];
            scale[0] += alpha[0][i];
        }
        
        scale[0] = 1.0 / scale[0]
        for(var i = 0; i < this.state_num; i++){
            alpha[0][i] *= scale[0];
        }
        
        for(var t = 0; t < observations.length; t++){
            scale[t] = 0;
            for(var i = 0; i < this.state_num; i++){
                alpha[t][i] = 0;
                for(var j = 0; j < this.state_num; j++){
                    alpha[t][i] += alpha[t - 1][j] * this.state_prob[j][i];
                }
                alpha[t][i] *= this.observed_prob[i][observations[t]];
                scale[t] += alpha[t][i];
            }
            scale[t] = 1.0 / scale[t]
            for(var i = 0; i < this.state_num; i++){
                alpha[t][i] *= scale[t];
            }
        }
    }
    
    backward_pass(beta, scale, observations){
        for(var i = 0; i < this.state_num; i++){
            beta[observations.length - 1][i] = scale[observations.length - 1];
        }
        for(var t = observations.length - 2; t >= 0; t--){
            for(var i = 0; i < this.state_num; i++){
                beta[t][i] = 0;
                for(var j = 0; j < this.state_num; j++){
                    beta[t][i] += this.state_prob[i][j] * this.observed_prob[j][observations[t + 1]] * beta[t + 1][j];
                }
                beta[t][i] *= scale[t]
            }
        }
    }
    
    compute_y(alpha, beta, y_probs, y_sums, observations){
        for(var t = 0; t < observations.length - 1; t++){
            for(var i = 0; i < this.state_num; i++){
                y_sums[t][i] = 0;
                for(var j = 0; j < this.state_num; j++){
                    y_probs[t][i][j] = alpha[t][i] * this.state_probs[i][j] * this.observed_probs[j][observations[t + 1]] * beta[t + 1][j];
                    y_sums[t][i] += y_probs[t][i][j]
                }
            }
        }
        
        for(var i = 0; i < this.state_num; i++){
            y_sums[observations.length - 1][i] = alpha[observations.length - 1][i];
        }
    }
    
    re_estimate(y_probs, y_sums, observations){
        for(var i = 0; i < this.state_num; i++){
            this.start_probs[i] = y_sums[0][i];
        }
        
        for(var i = 0; i < this.state_num; i++){
            var denom = 0;
            for(var t = 0; t < observations.length - 1; t++){
                denom += y_sums[t][i];
            }
            for(var j = 0; j < this.state_num; j++){
                var numer = 0;
                for(var t = 0; t < observations.length - 1; t++){
                    numer += y_probs[t][i][j];
                }
                this.state_probs[i][j] = numer / denom;
            }
        }
        
        for(var i = 0; i < this.state_num; i++){
            var denom = 0;
            for(var t = 0; t < observations.length - 1; t++){
                denom += y_sums[t][i];
            }
            for(var j = 0; j < this.state_num; j++){
                var numer = 0;
                for(var t = 0; t < observations.length - 1; t++){
                    if(observations[t] == j){
                        numer += y_sums[t][i];
                    }
                }
                this.observed_probs[i][j] = numer / denom;
            }
        }
    }
    
    compute_log_prob(scale, observations){
        var log_prob = 0;
        for(var i = 0; i < observations.length - 1; i++){
            log_prob += Math.log(scale[i]);
        }
        return log_prob * -1;
    }
    
    run(observations){
        var alpha = new Array(observations.length);
        var beta = new Array(observations.length);
        var y_sums = new Array(observations.length);
        var y_probs = new Array(observations.length);
        for(var i = 0; i < observations.length; i++){
            alpha[i] = new Array(this.state_num);
            beta[i] = new Array(this.state_num);
            y_sums[i] = new Array(this.state_num);
            y_probs[i] = new Array(this.state_num);
            for(var j = 0; j < this.state_num; j++){
                y_probs[i][j] = new Array(this.state_num);
            }
        }
        var scale = new Array(observations.length);
        var iters = 0;
        var log_prob = Number.NEGATIVE_INFINITY;
        var old_log_prob;
        do{
            old_log_prob = log_prob;
            forward_pass(alpha, scale, observations);
            backward_pass(beta, scale, observations);
            compute_y(alpha, beta, y_probs, y_sums, observations);
            re_estimate(y_probs, y_sums, observations);
            log_prob = compute_log_prob(scale, observations);
            iters++;
        } while(iters < this.max_iters && log_prob > old_log_prob);
    }
}

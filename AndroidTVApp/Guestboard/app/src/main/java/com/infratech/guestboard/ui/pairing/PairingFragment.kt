package com.infratech.guestboard.ui.pairing

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.InputFilter
import android.text.TextWatcher
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.infratech.guestboard.R
import com.infratech.guestboard.ui.welcome.WelcomeActivity
import kotlinx.coroutines.launch

class PairingFragment : Fragment() {
    private val viewModel: PairingViewModel by viewModels()
    private lateinit var codeInputs: List<EditText>
    private lateinit var pairButton: View
    private lateinit var statusText: TextView
    private lateinit var progressBar: ProgressBar

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_pairing, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        codeInputs = listOf(
            view.findViewById(R.id.code_1),
            view.findViewById(R.id.code_2),
            view.findViewById(R.id.code_3),
            view.findViewById(R.id.code_4),
            view.findViewById(R.id.code_5),
            view.findViewById(R.id.code_6)
        )
        pairButton = view.findViewById(R.id.pair_button)
        statusText = view.findViewById(R.id.status_text)
        progressBar = view.findViewById(R.id.progress_bar)

        setupCodeInputs()

        pairButton.setOnClickListener {
            val code = codeInputs.joinToString("") { it.text.toString() }
            viewModel.pair(code)
        }

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    when (state) {
                        is PairingUiState.Idle -> {
                            progressBar.visibility = View.GONE
                            statusText.text = ""
                            setInputsEnabled(true)
                        }
                        is PairingUiState.Loading -> {
                            progressBar.visibility = View.VISIBLE
                            statusText.text = "Pairing..."
                            setInputsEnabled(false)
                        }
                        is PairingUiState.Success -> {
                            progressBar.visibility = View.GONE
                            statusText.text = "Paired to ${state.propertyName}!"
                            startActivity(Intent(requireContext(), WelcomeActivity::class.java))
                            requireActivity().finish()
                        }
                        is PairingUiState.Error -> {
                            progressBar.visibility = View.GONE
                            statusText.text = state.message
                            setInputsEnabled(true)
                        }
                    }
                }
            }
        }
    }

    private fun setupCodeInputs() {
        codeInputs.forEachIndexed { index, editText ->
            editText.filters = arrayOf(InputFilter.LengthFilter(1), InputFilter.AllCaps())

            editText.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    if (s?.length == 1 && index < codeInputs.size - 1) {
                        codeInputs[index + 1].requestFocus()
                    }
                }
            })

            editText.setOnKeyListener { _, keyCode, event ->
                if (keyCode == KeyEvent.KEYCODE_DEL && event.action == KeyEvent.ACTION_DOWN) {
                    if (editText.text.isEmpty() && index > 0) {
                        codeInputs[index - 1].apply {
                            setText("")
                            requestFocus()
                        }
                        true
                    } else false
                } else false
            }
        }
    }

    private fun setInputsEnabled(enabled: Boolean) {
        codeInputs.forEach { it.isEnabled = enabled }
        pairButton.isEnabled = enabled
    }
}
